const Order = require("../models/order.model");
const Product = require("../models/product.model");
const Quotation = require("../models/quotation.model");
const RFQ = require("../models/rfq.model");

// Configurable scoring weights (totaling 1.0)
const RANKING_WEIGHTS = {
  cost: 0.40,
  delivery: 0.25,
  stock: 0.20,
  reliability: 0.10,
  validity: 0.05,
};

/**
 * Calculates genuine supplier delivery reliability based on completed orders.
 * Returns neutral score and explicit label if < 3 completed orders exist.
 */
const getSupplierReliability = async (supplierId) => {
  const completedOrders = await Order.find({
    supplier: supplierId,
    orderStatus: "delivered",
  }).select("estimatedDelivery deliveredAt updatedAt");

  if (!completedOrders || completedOrders.length < 3) {
    return {
      hasSufficientHistory: false,
      score: 50,
      totalOrders: completedOrders ? completedOrders.length : 0,
      onTimeRate: null,
      label: "Insufficient history (< 3 delivered orders)",
    };
  }

  let onTimeCount = 0;
  for (const order of completedOrders) {
    const actualDelivery = order.deliveredAt || order.updatedAt;
    if (order.estimatedDelivery) {
      if (new Date(actualDelivery) <= new Date(order.estimatedDelivery)) {
        onTimeCount++;
      }
    } else {
      // If estimated delivery date was not recorded on legacy order, count as completed
      onTimeCount++;
    }
  }

  const onTimeRate = Math.round((onTimeCount / completedOrders.length) * 100);
  return {
    hasSufficientHistory: true,
    score: onTimeRate,
    totalOrders: completedOrders.length,
    onTimeRate,
    label: `${onTimeRate}% on-time rate (${completedOrders.length} completed orders)`,
  };
};

/**
 * Scores delivery suitability relative to RFQ requiredBy deadline.
 */
const calculateDeliveryScore = (estimatedDelivery, requiredBy) => {
  if (!estimatedDelivery || !requiredBy) {
    return {
      score: 50,
      explanation: "Delivery date or required deadline not specified",
    };
  }

  const est = new Date(estimatedDelivery).getTime();
  const req = new Date(requiredBy).getTime();
  const diffHours = (req - est) / (1000 * 60 * 60);

  if (diffHours >= 24) {
    return {
      score: 100,
      explanation: `Arrives comfortably early (${Math.round(diffHours / 24)} days before deadline)`,
    };
  }

  if (diffHours >= 0) {
    return {
      score: 90,
      explanation: "Arrives on schedule before required deadline",
    };
  }

  // Late delivery penalty
  const hoursLate = Math.abs(diffHours);
  const daysLate = Math.ceil(hoursLate / 24);
  const score = Math.max(0, 70 - daysLate * 20);

  return {
    score,
    explanation: `Estimated delivery is ${daysLate} day(s) late`,
  };
};

/**
 * Evaluates stock availability against the required quantity.
 */
const calculateStockScore = (currentStock, requiredQuantity) => {
  if (currentStock === undefined || currentStock === null) {
    return {
      score: 50,
      isFulfilled: false,
      explanation: "Stock availability unverified",
    };
  }

  if (currentStock >= requiredQuantity) {
    return {
      score: 100,
      isFulfilled: true,
      explanation: `Full stock available (${currentStock} available for ${requiredQuantity} requested)`,
    };
  }

  if (currentStock > 0) {
    const ratio = currentStock / requiredQuantity;
    return {
      score: Math.round(ratio * 70),
      isFulfilled: false,
      explanation: `Partial stock available (${currentStock}/${requiredQuantity})`,
    };
  }

  return {
    score: 10,
    isFulfilled: false,
    explanation: "Out of stock / backorder required",
  };
};

/**
 * Evaluates validity window of the quotation.
 */
const calculateValidityScore = (validUntil, status) => {
  if (status === "expired" || (validUntil && new Date(validUntil) < new Date())) {
    return { score: 0, isExpired: true, explanation: "Quotation has expired" };
  }

  if (!validUntil) {
    return { score: 70, isExpired: false, explanation: "Validity window unspecified" };
  }

  const msRemaining = new Date(validUntil).getTime() - Date.now();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  if (hoursRemaining >= 24) {
    return { score: 100, isExpired: false, explanation: "Valid for > 24 hours" };
  }
  if (hoursRemaining >= 12) {
    return { score: 80, isExpired: false, explanation: "Expires in 12-24 hours" };
  }
  return { score: 60, isExpired: false, explanation: "Expires in < 12 hours (Urgent)" };
};

/**
 * Generates human-readable summary explanation of the ranking.
 */
const generateExplanation = (factors, quote, isTopRanked) => {
  const parts = [];

  if (isTopRanked) {
    parts.push("Top recommendation:");
  }

  if (factors.costScore >= 90) {
    parts.push("Most competitive effective price");
  } else if (factors.costScore < 50) {
    parts.push("Higher cost than competing bids");
  }

  if (factors.deliveryScore >= 90) {
    parts.push("meets delivery deadline");
  } else if (factors.deliveryScore < 60) {
    parts.push("potential delivery delay");
  }

  if (factors.stockScore === 100) {
    parts.push("full stock in inventory");
  } else if (factors.stockScore <= 20) {
    parts.push("low/no current inventory");
  }

  if (factors.reliabilityInfo.hasSufficientHistory) {
    parts.push(`${factors.reliabilityInfo.onTimeRate}% on-time supplier track record`);
  }

  return parts.join(" — ") || "Standard quote matching RFQ requirements.";
};

/**
 * Main service function to rank quotations for a given RFQ.
 * Pure read-only ranking: never modifies quotation status or awards bids.
 */
const rankQuotationsForRFQ = async (rfqId, restaurantId = null) => {
  const rfq = await RFQ.findById(rfqId);
  if (!rfq) {
    const error = new Error("RFQ not found");
    error.statusCode = 404;
    throw error;
  }

  if (restaurantId && rfq.restaurant.toString() !== restaurantId.toString()) {
    const error = new Error("Forbidden. You do not own this RFQ.");
    error.statusCode = 403;
    throw error;
  }

  // Fetch all quotations for this RFQ
  const quotations = await Quotation.find({ rfq: rfqId })
    .populate("supplier", "name email phone")
    .populate("product", "name stock price unit isActive");

  if (!quotations || quotations.length === 0) {
    return {
      rfq: {
        _id: rfq._id,
        productName: rfq.productName,
        quantity: rfq.quantity,
        unit: rfq.unit,
        requiredBy: rfq.requiredBy,
        status: rfq.status,
      },
      rankedQuotations: [],
      summary: {
        totalQuotations: 0,
        eligibleCount: 0,
        bestPrice: null,
      },
    };
  }

  // Pre-calculate effective prices and costs for all quoted items
  const quoteData = quotations.map((q) => {
    const isQuoted = q.status === "quoted";
    const quotedPrice = q.quotedPrice !== undefined && q.quotedPrice !== null ? q.quotedPrice : q.listedPrice;
    const discount = q.discountPercentage || 0;
    const effectiveUnitPrice = Number((quotedPrice * (1 - discount / 100)).toFixed(2));
    const effectiveTotalCost = Number((effectiveUnitPrice * rfq.quantity).toFixed(2));

    const isExpired =
      q.status === "expired" ||
      (q.validUntil && new Date(q.validUntil) < new Date());

    const isEligible = isQuoted && !isExpired;

    return {
      quotation: q,
      isQuoted,
      isEligible,
      isExpired,
      effectiveUnitPrice,
      effectiveTotalCost,
      quotedPrice,
      discount,
    };
  });

  // Calculate min and max effective cost among eligible quotations for normalization
  const eligibleQuotes = quoteData.filter((qd) => qd.isEligible);
  let minCost = 0;
  let maxCost = 0;

  if (eligibleQuotes.length > 0) {
    minCost = Math.min(...eligibleQuotes.map((qd) => qd.effectiveTotalCost));
    maxCost = Math.max(...eligibleQuotes.map((qd) => qd.effectiveTotalCost));
  }

  // Evaluate each quotation against the 5 factors
  const evaluatedQuotes = await Promise.all(
    quoteData.map(async (item) => {
      const q = item.quotation;

      if (!item.isEligible) {
        return {
          _id: q._id,
          supplier: q.supplier,
          product: q.product,
          status: q.status,
          quotedPrice: item.quotedPrice,
          discountPercentage: item.discount,
          effectiveUnitPrice: item.effectiveUnitPrice,
          effectiveTotalCost: item.effectiveTotalCost,
          estimatedDelivery: q.estimatedDelivery,
          validUntil: q.validUntil,
          supplierNote: q.supplierNote,
          isEligible: false,
          ineligibilityReason: item.isExpired
            ? "Quotation has expired"
            : `Quotation status is '${q.status}'`,
          score: 0,
          rank: null,
          factors: null,
          explanation: `Ineligible: ${q.status}`,
        };
      }

      // 1. Cost Score (0 - 100)
      let costScore = 100;
      if (maxCost > minCost) {
        costScore = Math.round(100 * (1 - (item.effectiveTotalCost - minCost) / (maxCost - minCost || 1)));
      }

      // 2. Delivery Suitability Score (0 - 100)
      const deliveryEval = calculateDeliveryScore(q.estimatedDelivery, rfq.requiredBy);

      // 3. Stock Availability Score (0 - 100)
      const currentStock = q.product?.stock;
      const stockEval = calculateStockScore(currentStock, rfq.quantity);

      // 4. Validity Score (0 - 100)
      const validityEval = calculateValidityScore(q.validUntil, q.status);

      // 5. Historical Supplier Reliability Score (0 - 100)
      const reliabilityInfo = await getSupplierReliability(q.supplier?._id || q.supplier);

      // Calculate total weighted score
      const totalScore = Math.round(
        costScore * RANKING_WEIGHTS.cost +
        deliveryEval.score * RANKING_WEIGHTS.delivery +
        stockEval.score * RANKING_WEIGHTS.stock +
        validityEval.score * RANKING_WEIGHTS.validity +
        reliabilityInfo.score * RANKING_WEIGHTS.reliability
      );

      return {
        _id: q._id,
        supplier: q.supplier,
        product: q.product,
        status: q.status,
        quotedPrice: item.quotedPrice,
        discountPercentage: item.discount,
        effectiveUnitPrice: item.effectiveUnitPrice,
        effectiveTotalCost: item.effectiveTotalCost,
        estimatedDelivery: q.estimatedDelivery,
        validUntil: q.validUntil,
        supplierNote: q.supplierNote,
        isEligible: true,
        score: Math.max(0, Math.min(100, totalScore)),
        factors: {
          cost: {
            score: costScore,
            effectiveUnitPrice: item.effectiveUnitPrice,
            effectiveTotalCost: item.effectiveTotalCost,
            weight: RANKING_WEIGHTS.cost,
          },
          delivery: {
            score: deliveryEval.score,
            estimatedDelivery: q.estimatedDelivery,
            requiredBy: rfq.requiredBy,
            explanation: deliveryEval.explanation,
            weight: RANKING_WEIGHTS.delivery,
          },
          stock: {
            score: stockEval.score,
            currentStock,
            requiredQuantity: rfq.quantity,
            isFulfilled: stockEval.isFulfilled,
            explanation: stockEval.explanation,
            weight: RANKING_WEIGHTS.stock,
          },
          validity: {
            score: validityEval.score,
            validUntil: q.validUntil,
            explanation: validityEval.explanation,
            weight: RANKING_WEIGHTS.validity,
          },
          reliability: {
            score: reliabilityInfo.score,
            hasSufficientHistory: reliabilityInfo.hasSufficientHistory,
            onTimeRate: reliabilityInfo.onTimeRate,
            totalOrders: reliabilityInfo.totalOrders,
            label: reliabilityInfo.label,
            weight: RANKING_WEIGHTS.reliability,
          },
        },
      };
    })
  );

  // Deterministic stable sort:
  // 1. Eligible first
  // 2. Score descending
  // 3. Effective cost ascending
  // 4. Estimated delivery ascending
  // 5. _id ascending for tie-breaking
  evaluatedQuotes.sort((a, b) => {
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    if (!a.isEligible && !b.isEligible) return 0;

    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (a.effectiveTotalCost !== b.effectiveTotalCost) {
      return a.effectiveTotalCost - b.effectiveTotalCost;
    }
    const aEst = a.estimatedDelivery ? new Date(a.estimatedDelivery).getTime() : Infinity;
    const bEst = b.estimatedDelivery ? new Date(b.estimatedDelivery).getTime() : Infinity;
    if (aEst !== bEst) {
      return aEst - bEst;
    }
    return String(a._id).localeCompare(String(b._id));
  });

  // Assign ranks and generate explanation
  let rankCounter = 1;
  const rankedQuotations = evaluatedQuotes.map((item) => {
    if (item.isEligible) {
      item.rank = rankCounter++;
      item.explanation = generateExplanation(
        {
          costScore: item.factors.cost.score,
          deliveryScore: item.factors.delivery.score,
          stockScore: item.factors.stock.score,
          reliabilityInfo: item.factors.reliability,
        },
        item,
        item.rank === 1
      );
    }
    return item;
  });

  return {
    rfq: {
      _id: rfq._id,
      productName: rfq.productName,
      quantity: rfq.quantity,
      unit: rfq.unit,
      requiredBy: rfq.requiredBy,
      status: rfq.status,
    },
    rankedQuotations,
    summary: {
      totalQuotations: quotations.length,
      eligibleCount: eligibleQuotes.length,
      bestPrice: minCost || null,
      topRankedSupplier: rankedQuotations.find((q) => q.rank === 1)?.supplier?.name || null,
    },
  };
};

module.exports = {
  RANKING_WEIGHTS,
  getSupplierReliability,
  calculateDeliveryScore,
  calculateStockScore,
  calculateValidityScore,
  rankQuotationsForRFQ,
};

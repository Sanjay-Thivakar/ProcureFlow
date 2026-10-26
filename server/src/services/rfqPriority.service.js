const RFQ = require("../models/rfq.model");
const Quotation = require("../models/quotation.model");

/**
 * Calculates priority for an RFQ from the Restaurant's perspective.
 */
const evaluateRestaurantRFQPriority = (rfq, quotations = []) => {
  const now = new Date();
  const requiredByDate = rfq.requiredBy ? new Date(rfq.requiredBy) : null;
  const createdAtDate = rfq.createdAt ? new Date(rfq.createdAt) : null;

  // Completed or cancelled RFQs are Low priority
  if (rfq.status !== "open") {
    return {
      priority: "Low",
      score: 10,
      reason: `RFQ is ${rfq.status}`,
      badgeColor: "gray",
      actionNeeded: false,
    };
  }

  const activeQuoted = quotations.filter(
    (q) =>
      q.status === "quoted" &&
      (!q.validUntil || new Date(q.validUntil) >= now)
  );

  const pendingQuotes = quotations.filter((q) => q.status === "pending");

  // Check for expiring quotations
  let earliestExpiryHours = Infinity;
  for (const q of activeQuoted) {
    if (q.validUntil) {
      const diffHours = (new Date(q.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60);
      if (diffHours < earliestExpiryHours) {
        earliestExpiryHours = diffHours;
      }
    }
  }

  // Delivery deadline proximity
  const hoursUntilDelivery = requiredByDate
    ? (requiredByDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    : Infinity;

  // Age of RFQ in hours
  const hoursSinceCreation = createdAtDate
    ? (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60)
    : 0;

  // 1. URGENT CONDITIONS
  if (earliestExpiryHours <= 12 && earliestExpiryHours > 0) {
    return {
      priority: "Urgent",
      score: 95,
      reason: `Quotation expires in ${Math.max(1, Math.round(earliestExpiryHours))} hour(s). Award decision required immediately.`,
      badgeColor: "red",
      actionNeeded: true,
      category: "EXPIRING_QUOTATION",
    };
  }

  if (hoursUntilDelivery <= 24 && hoursUntilDelivery > 0) {
    return {
      priority: "Urgent",
      score: 90,
      reason: `Required delivery deadline is in ${Math.max(1, Math.round(hoursUntilDelivery))} hour(s).`,
      badgeColor: "red",
      actionNeeded: true,
      category: "IMMINENT_DEADLINE",
    };
  }

  if (hoursUntilDelivery <= 0) {
    return {
      priority: "Urgent",
      score: 99,
      reason: "Required delivery deadline has passed.",
      badgeColor: "red",
      actionNeeded: true,
      category: "OVERDUE_DEADLINE",
    };
  }

  // 2. HIGH CONDITIONS
  if (activeQuoted.length > 0) {
    return {
      priority: "High",
      score: 75,
      reason: `${activeQuoted.length} active quotation(s) received and ready for review.`,
      badgeColor: "amber",
      actionNeeded: true,
      category: "READY_FOR_AWARD",
    };
  }

  if (hoursUntilDelivery <= 72) {
    return {
      priority: "High",
      score: 70,
      reason: `Required delivery in ${Math.round(hoursUntilDelivery / 24)} day(s) — still awaiting quotes.`,
      badgeColor: "amber",
      actionNeeded: true,
      category: "APPROACHING_DEADLINE",
    };
  }

  if (hoursSinceCreation >= 48 && activeQuoted.length === 0) {
    return {
      priority: "High",
      score: 65,
      reason: `No responses received after ${Math.round(hoursSinceCreation / 24)} days. Consider adding more suppliers.`,
      badgeColor: "amber",
      actionNeeded: true,
      category: "STALLED_RESPONSES",
    };
  }

  // 3. NORMAL
  return {
    priority: "Normal",
    score: 40,
    reason: `Awaiting responses from ${pendingQuotes.length} invited supplier(s).`,
    badgeColor: "blue",
    actionNeeded: false,
    category: "IN_PROGRESS",
  };
};

/**
 * Calculates priority for an RFQ / Quotation from the Supplier's perspective.
 */
const evaluateSupplierRFQPriority = (rfq, quotation) => {
  const now = new Date();
  const requiredByDate = rfq.requiredBy ? new Date(rfq.requiredBy) : null;
  const createdAtDate = quotation.createdAt ? new Date(quotation.createdAt) : null;

  if (rfq.status !== "open" || quotation.status !== "pending") {
    return {
      priority: "Low",
      score: 15,
      reason: quotation.status === "quoted" ? "Quote already submitted" : `Status: ${quotation.status}`,
      badgeColor: "gray",
      actionNeeded: false,
    };
  }

  const hoursUntilDelivery = requiredByDate
    ? (requiredByDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    : Infinity;

  const hoursPending = createdAtDate
    ? (now.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60)
    : 0;

  if (hoursUntilDelivery <= 24) {
    return {
      priority: "Urgent",
      score: 95,
      reason: `Restaurant requires delivery within ${Math.max(1, Math.round(hoursUntilDelivery))} hour(s).`,
      badgeColor: "red",
      actionNeeded: true,
      category: "IMMINENT_DEADLINE",
    };
  }

  if (hoursPending >= 48) {
    return {
      priority: "Urgent",
      score: 85,
      reason: `Request pending response for ${Math.round(hoursPending / 24)} days.`,
      badgeColor: "red",
      actionNeeded: true,
      category: "AGED_REQUEST",
    };
  }

  if (hoursUntilDelivery <= 72) {
    return {
      priority: "High",
      score: 70,
      reason: `Required delivery within ${Math.round(hoursUntilDelivery / 24)} days.`,
      badgeColor: "amber",
      actionNeeded: true,
      category: "APPROACHING_DEADLINE",
    };
  }

  return {
    priority: "Normal",
    score: 40,
    reason: "New quotation request.",
    badgeColor: "blue",
    actionNeeded: true,
    category: "NEW_REQUEST",
  };
};

/**
 * Prioritizes all RFQs for a restaurant.
 */
const prioritizeRestaurantRFQs = async (restaurantId) => {
  const rfqs = await RFQ.find({ restaurant: restaurantId }).sort({ createdAt: -1 });

  const prioritized = await Promise.all(
    rfqs.map(async (rfq) => {
      const quotations = await Quotation.find({ rfq: rfq._id })
        .populate("supplier", "name email");

      const priorityInfo = evaluateRestaurantRFQPriority(rfq, quotations);

      return {
        ...rfq.toObject(),
        quotations,
        priority: priorityInfo.priority,
        priorityScore: priorityInfo.score,
        priorityReason: priorityInfo.reason,
        priorityBadgeColor: priorityInfo.badgeColor,
        actionNeeded: priorityInfo.actionNeeded,
      };
    })
  );

  // Stable sort by priority score descending, then requiredBy date
  prioritized.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    const aReq = a.requiredBy ? new Date(a.requiredBy).getTime() : Infinity;
    const bReq = b.requiredBy ? new Date(b.requiredBy).getTime() : Infinity;
    return aReq - bReq;
  });

  return prioritized;
};

/**
 * Prioritizes all incoming quotation requests for a supplier.
 */
const prioritizeSupplierRFQs = async (supplierId) => {
  const quotations = await Quotation.find({ supplier: supplierId })
    .populate("restaurant", "name email")
    .populate("rfq")
    .populate("product", "name stock price unit");

  const prioritized = quotations
    .filter((q) => q.rfq)
    .map((q) => {
      const priorityInfo = evaluateSupplierRFQPriority(q.rfq, q);

      return {
        ...q.toObject(),
        priority: priorityInfo.priority,
        priorityScore: priorityInfo.score,
        priorityReason: priorityInfo.reason,
        priorityBadgeColor: priorityInfo.badgeColor,
        actionNeeded: priorityInfo.actionNeeded,
      };
    });

  // Sort by priorityScore descending, then createdAt ascending
  prioritized.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return prioritized;
};

module.exports = {
  evaluateRestaurantRFQPriority,
  evaluateSupplierRFQPriority,
  prioritizeRestaurantRFQs,
  prioritizeSupplierRFQs,
};

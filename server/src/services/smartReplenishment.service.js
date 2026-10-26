const mongoose = require("mongoose");
const { getSupplierDemandHistory } = require("./supplierDemandHistory.service");
const { calculateMedian, evaluateChronologicalForecast } = require("./demandForecast.service");

/**
 * Calculates replenishment recommendations and demand analytics for a supplier.
 * 
 * Distinctly separates:
 * 1. Historical demand measurements (orders, volumes, frequencies, intervals).
 * 2. Estimated future demand (projected 14-day and 30-day demand).
 * 3. Supplier inventory and projected stock risk (on-hand stock, stock coverage, stockout risk).
 * 4. Suggested replenishment quantity (defensible target deficit, lead time notices).
 *
 * @param {string|mongoose.Types.ObjectId} supplierId
 * @param {object} [filters={}] - Optional filters (status, category, search)
 * @returns {Promise<object>} Summary overview and detailed product replenishment recommendations
 */
const getSupplierReplenishmentRecommendations = async (supplierId, filters = {}) => {
  const demandHistories = await getSupplierDemandHistory(supplierId);

  if (!demandHistories || demandHistories.length === 0) {
    return {
      overview: {
        totalMonitoredProducts: 0,
        stockoutRiskCount: 0,
        lowStockCount: 0,
        adequateCount: 0,
        insufficientHistoryCount: 0,
      },
      methodologyNote:
        "Demand metrics are aggregated across legitimate restaurant orders placed for your products. Private restaurant identities are strictly masked. Projections reflect order patterns; manufacturing lead time is not tracked.",
      recommendations: [],
    };
  }

  const now = new Date();

  const items = demandHistories.map((productGroup) => {
    const deliveredOrders = productGroup.deliveredOrders || [];
    const inFlightOrders = productGroup.inFlightOrders || [];
    const deliveredCount = deliveredOrders.length;
    const inFlightCount = inFlightOrders.length;
    const totalOrderCount = deliveredCount + inFlightCount;

    const currentStock = Number(productGroup.currentStock) || 0;
    const unit = productGroup.unit || "unit";

    // ---------------------------------------------------------
    // DIMENSION 1: Historical Demand Measurements
    // ---------------------------------------------------------
    let lastOrderDate = null;
    let daysSinceLastOrder = null;
    let typicalOrderQuantity = 0;
    let averageOrderQuantity = 0;
    let totalUnitsSold = 0;
    let committedUnits = 0;
    let medianOrderIntervalDays = null;
    let dailyDemandRate = null;
    let confidenceLabel = "Insufficient Data";
    let fulfillmentLeadTimeDays = null;

    // Committed units from active in-flight orders
    if (inFlightCount > 0) {
      committedUnits = inFlightOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);
    }

    if (deliveredCount > 0) {
      // Historical delivered orders
      const deliveredQuantities = deliveredOrders.map((o) => o.quantity);
      totalUnitsSold = deliveredQuantities.reduce((sum, q) => sum + q, 0);
      typicalOrderQuantity = calculateMedian(deliveredQuantities);
      averageOrderQuantity = Number(
        (totalUnitsSold / deliveredQuantities.length).toFixed(1)
      );

      // Most recent order date
      const lastOrder = deliveredOrders[deliveredOrders.length - 1];
      lastOrderDate = lastOrder.orderDate;
      daysSinceLastOrder = Math.max(
        0,
        Math.floor((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      // Fulfillment lead time (order created to delivered)
      const leadTimeDurations = deliveredOrders
        .filter((o) => o.deliveredAt && o.createdAt)
        .map((o) =>
          Math.max(
            0,
            Math.round(
              (new Date(o.deliveredAt).getTime() - new Date(o.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        );
      if (leadTimeDurations.length > 0) {
        fulfillmentLeadTimeDays = calculateMedian(leadTimeDurations);
      }

      // Order intervals across chronological purchases (requires >= 2 delivered orders)
      if (deliveredCount >= 2) {
        const intervals = [];
        for (let i = 0; i < deliveredOrders.length - 1; i++) {
          const t1 = deliveredOrders[i].orderDate.getTime();
          const t2 = deliveredOrders[i + 1].orderDate.getTime();
          const diffDays = Math.max(0, Math.round((t2 - t1) / (1000 * 60 * 60 * 24)));
          intervals.push(diffDays);
        }

        medianOrderIntervalDays = Math.max(1, calculateMedian(intervals));

        // Daily demand rate = typical order quantity / median order interval
        dailyDemandRate = Number(
          (typicalOrderQuantity / Math.max(1, medianOrderIntervalDays)).toFixed(2)
        );

        if (deliveredCount >= 5) {
          confidenceLabel = "High";
        } else if (deliveredCount >= 3) {
          confidenceLabel = "Moderate";
        } else {
          confidenceLabel = "Provisional";
        }
      } else {
        confidenceLabel = "Insufficient Data";
      }
    } else if (inFlightCount > 0) {
      const inFlightQuantities = inFlightOrders.map((o) => o.quantity);
      typicalOrderQuantity = calculateMedian(inFlightQuantities);
      confidenceLabel = "Insufficient Data";
    }

    // ---------------------------------------------------------
    // DIMENSION 2: Estimated Future Demand
    // ---------------------------------------------------------
    let projected14DayDemand = null;
    let projected30DayDemand = null;
    let demandEstimationNotice = null;

    if (dailyDemandRate !== null && dailyDemandRate > 0) {
      projected14DayDemand = Math.max(1, Math.round(dailyDemandRate * 14));
      projected30DayDemand = Math.max(1, Math.round(dailyDemandRate * 30));
    } else if (deliveredCount === 1) {
      demandEstimationNotice =
        "Only 1 completed order recorded. At least 2 completed orders are required to estimate demand rate.";
    } else {
      demandEstimationNotice =
        "No historical delivered orders. Future demand cannot be projected yet.";
    }

    // ---------------------------------------------------------
    // DIMENSION 3: Supplier Inventory & Projected Stock Risk
    // ---------------------------------------------------------
    let daysOfStockRemaining = null;
    let stockRisk = "insufficient_data";
    let stockRiskLabel = "Insufficient History";

    if (dailyDemandRate !== null && dailyDemandRate > 0) {
      daysOfStockRemaining = Math.max(
        0,
        Math.round(currentStock / dailyDemandRate)
      );

      if (currentStock === 0) {
        stockRisk = "stockout_risk";
        stockRiskLabel = "Out of Stock";
      } else if (daysOfStockRemaining <= 7) {
        stockRisk = "stockout_risk";
        stockRiskLabel = "Critical Stockout Risk";
      } else if (daysOfStockRemaining <= 14) {
        stockRisk = "low_stock";
        stockRiskLabel = "Low Stock";
      } else if (daysOfStockRemaining > 60) {
        stockRisk = "adequate";
        stockRiskLabel = "Excess Inventory";
      } else {
        stockRisk = "adequate";
        stockRiskLabel = "Adequate Stock";
      }
    } else {
      if (currentStock === 0 && totalOrderCount > 0) {
        stockRisk = "stockout_risk";
        stockRiskLabel = "Out of Stock";
      } else if (totalOrderCount === 0) {
        stockRisk = "adequate";
        stockRiskLabel = currentStock > 0 ? "Stocked (No Orders Yet)" : "Out of Stock";
        if (currentStock === 0) stockRisk = "stockout_risk";
      } else {
        stockRisk = "insufficient_data";
        stockRiskLabel = "Insufficient History";
      }
    }

    // ---------------------------------------------------------
    // DIMENSION 4: Suggested Replenishment Quantity
    // ---------------------------------------------------------
    let suggestedReplenishmentQuantity = null;
    let replenishmentExplanation = "";

    if (projected30DayDemand !== null) {
      if (currentStock >= projected30DayDemand) {
        suggestedReplenishmentQuantity = 0;
        replenishmentExplanation = `Current warehouse stock (${currentStock} ${unit}) is sufficient to cover projected 30-day demand (${projected30DayDemand} ${unit}). No replenishment needed at this time.`;
      } else {
        suggestedReplenishmentQuantity = Math.max(
          1,
          Math.round(projected30DayDemand - currentStock)
        );
        replenishmentExplanation = `Current warehouse stock (${currentStock} ${unit}) is below projected 30-day demand (${projected30DayDemand} ${unit}). Suggested replenishment is ${suggestedReplenishmentQuantity} ${unit} to maintain safe stock levels.`;
      }
    } else {
      suggestedReplenishmentQuantity = null;
      replenishmentExplanation =
        "Insufficient historical demand to compute a defensible replenishment quantity. Please monitor warehouse stock manually.";
    }

    // ---------------------------------------------------------
    // Chronological Walk-Forward Forecast (when >= 5 orders exist)
    // ---------------------------------------------------------
    const forecastInfo = evaluateChronologicalForecast(deliveredOrders);

    return {
      productId: productGroup.productId,
      productName: productGroup.name,
      category: productGroup.category,
      unit,
      price: productGroup.price,
      isArchivedOrUnlisted: Boolean(productGroup.isArchivedOrUnlisted),

      // 1. Historical Demand Measurements
      measurements: {
        totalOrders: totalOrderCount,
        deliveredOrdersCount: deliveredCount,
        inFlightOrdersCount: inFlightCount,
        totalUnitsSold,
        committedUnits,
        typicalOrderQuantity,
        averageOrderQuantity,
        medianOrderIntervalDays,
        lastOrderDate,
        daysSinceLastOrder,
        dailyDemandRate,
        historicalFulfillmentLeadTimeDays: fulfillmentLeadTimeDays,
      },

      // 2. Estimated Future Demand
      estimatedDemand: {
        projected14DayDemand,
        projected30DayDemand,
        demandEstimationNotice,
      },

      // 3. Supplier Inventory and Projected Stock Risk
      inventoryRisk: {
        currentStock,
        committedUnits,
        effectiveAvailableStock: Math.max(0, currentStock - committedUnits),
        daysOfStockRemaining,
        stockRisk, // 'stockout_risk' | 'low_stock' | 'adequate' | 'insufficient_data'
        stockRiskLabel,
      },

      // 4. Suggested Replenishment Quantity
      replenishment: {
        suggestedQuantity: suggestedReplenishmentQuantity,
        explanation: replenishmentExplanation,
        leadTimeNotice:
          "Supplier procurement/restock lead time is not recorded in ProcureFlow. Projections are calculated over a standard 30-day planning horizon.",
      },

      confidenceLabel,
      forecast: forecastInfo,
    };
  });

  // Sort by urgency:
  // 1. stockout_risk first
  // 2. low_stock second
  // 3. adequate third
  // 4. insufficient_data last
  const riskRank = {
    stockout_risk: 1,
    low_stock: 2,
    adequate: 3,
    insufficient_data: 4,
  };

  items.sort((a, b) => {
    const rankDiff =
      riskRank[a.inventoryRisk.stockRisk] - riskRank[b.inventoryRisk.stockRisk];
    if (rankDiff !== 0) return rankDiff;

    // Secondary: Lowest daysOfStockRemaining first
    const aDays =
      a.inventoryRisk.daysOfStockRemaining !== null
        ? a.inventoryRisk.daysOfStockRemaining
        : 999;
    const bDays =
      b.inventoryRisk.daysOfStockRemaining !== null
        ? b.inventoryRisk.daysOfStockRemaining
        : 999;
    if (aDays !== bDays) return aDays - bDays;

    return a.productName.localeCompare(b.productName);
  });

  // Overview stats
  const overview = {
    totalMonitoredProducts: items.length,
    stockoutRiskCount: items.filter(
      (i) => i.inventoryRisk.stockRisk === "stockout_risk"
    ).length,
    lowStockCount: items.filter((i) => i.inventoryRisk.stockRisk === "low_stock")
      .length,
    adequateCount: items.filter((i) => i.inventoryRisk.stockRisk === "adequate")
      .length,
    insufficientHistoryCount: items.filter(
      (i) => i.inventoryRisk.stockRisk === "insufficient_data"
    ).length,
  };

  // Filter application
  let filteredItems = items;

  if (filters.status) {
    const targetStatus = filters.status.toLowerCase();
    filteredItems = filteredItems.filter(
      (i) => i.inventoryRisk.stockRisk.toLowerCase() === targetStatus
    );
  }

  if (filters.category && filters.category !== "All") {
    filteredItems = filteredItems.filter(
      (i) => i.category.toLowerCase() === filters.category.toLowerCase()
    );
  }

  if (filters.search && typeof filters.search === "string" && filters.search.trim()) {
    const searchLower = filters.search.trim().toLowerCase();
    filteredItems = filteredItems.filter((i) =>
      i.productName.toLowerCase().includes(searchLower)
    );
  }

  return {
    overview,
    methodologyNote:
      "Supplier replenishment estimates are derived from verified restaurant order patterns. Warehouse stock levels are measured directly from your product catalog. Private buyer identities are masked.",
    recommendations: filteredItems,
  };
};

module.exports = {
  getSupplierReplenishmentRecommendations,
};

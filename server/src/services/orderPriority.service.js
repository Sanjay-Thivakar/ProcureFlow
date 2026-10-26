const Order = require("../models/order.model");

/**
 * Evaluates priority for an individual order.
 * CRITICAL RULE: An overdue order must NOT be masked by favorable scores elsewhere.
 */
const evaluateOrderPriority = (order, perspective = "restaurant") => {
  const now = new Date();
  const estimatedDelivery = order.estimatedDelivery ? new Date(order.estimatedDelivery) : null;
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
  const updatedAt = order.updatedAt ? new Date(order.updatedAt) : new Date();

  const isCompletedOrInactive = ["delivered", "cancelled", "rejected"].includes(order.orderStatus);

  // 1. OVERDUE DELIVERY (Applies to all active in-progress orders)
  if (!isCompletedOrInactive && estimatedDelivery && estimatedDelivery < now) {
    const diffMs = now.getTime() - estimatedDelivery.getTime();
    const daysOverdue = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      priority: "Urgent",
      score: 100 + daysOverdue,
      reason: `Overdue: Expected delivery was ${daysOverdue} day(s) ago (${estimatedDelivery.toLocaleDateString()})`,
      badgeColor: "red",
      category: "OVERDUE",
      daysOverdue,
      estimatedDelivery,
      actionNeeded: true,
    };
  }

  // 2. AWAITING SUPPLIER CONFIRMATION
  if (order.orderStatus === "pending_supplier_confirmation") {
    const hoursWaiting = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursWaiting >= 24) {
      return {
        priority: "Urgent",
        score: 95,
        reason: perspective === "supplier"
          ? `Action needed: Order awaiting your confirmation for ${Math.round(hoursWaiting)} hours (> 24h threshold)`
          : `Supplier has not confirmed order for ${Math.round(hoursWaiting)} hours`,
        badgeColor: "red",
        category: "STALLED_CONFIRMATION",
        estimatedDelivery,
        actionNeeded: perspective === "supplier",
      };
    }

    if (hoursWaiting >= 6) {
      return {
        priority: "High",
        score: 75,
        reason: perspective === "supplier"
          ? `Order pending confirmation (${Math.round(hoursWaiting)} hours old)`
          : `Awaiting supplier confirmation (${Math.round(hoursWaiting)} hours old)`,
        badgeColor: "amber",
        category: "AWAITING_CONFIRMATION",
        estimatedDelivery,
        actionNeeded: perspective === "supplier",
      };
    }

    return {
      priority: "Normal",
      score: 50,
      reason: perspective === "supplier"
        ? "New order awaiting confirmation"
        : "Order placed, awaiting supplier confirmation",
      badgeColor: "blue",
      category: "RECENT_ORDER",
      estimatedDelivery,
      actionNeeded: perspective === "supplier",
    };
  }

  // 3. IN-PROGRESS ORDERS (confirmed, preparing, out_for_delivery)
  if (["confirmed", "preparing", "out_for_delivery"].includes(order.orderStatus)) {
    if (estimatedDelivery) {
      const hoursToDelivery = (estimatedDelivery.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursToDelivery <= 12 && hoursToDelivery > 0) {
        return {
          priority: "Urgent",
          score: 90,
          reason: `Delivery imminent: Scheduled within ${Math.max(1, Math.round(hoursToDelivery))} hour(s)`,
          badgeColor: "red",
          category: "IMMINENT_DELIVERY",
          estimatedDelivery,
          actionNeeded: order.orderStatus !== "out_for_delivery",
        };
      }

      if (hoursToDelivery <= 48 && hoursToDelivery > 0) {
        return {
          priority: "High",
          score: 70,
          reason: `Scheduled delivery in ${Math.max(1, Math.round(hoursToDelivery / 24))} day(s)`,
          badgeColor: "amber",
          category: "APPROACHING_DELIVERY",
          estimatedDelivery,
          actionNeeded: false,
        };
      }

      return {
        priority: "Normal",
        score: 40,
        reason: `On schedule for ${estimatedDelivery.toLocaleDateString()}`,
        badgeColor: "blue",
        category: "ON_SCHEDULE",
        estimatedDelivery,
        actionNeeded: false,
      };
    }

    // Active order without estimated delivery
    const hoursInStatus = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
    if (order.orderStatus === "preparing" && hoursInStatus >= 72) {
      return {
        priority: "High",
        score: 65,
        reason: `In preparation for ${Math.round(hoursInStatus / 24)} days without estimated delivery`,
        badgeColor: "amber",
        category: "STALLED_PREPARATION",
        estimatedDelivery: null,
        actionNeeded: true,
      };
    }

    return {
      priority: "Normal",
      score: 45,
      reason: `Order is ${order.orderStatus.replace(/_/g, " ")} (no delivery date specified)`,
      badgeColor: "blue",
      category: "IN_PROGRESS",
      estimatedDelivery: null,
      actionNeeded: false,
    };
  }

  // 4. DELIVERED ORDERS
  if (order.orderStatus === "delivered") {
    if (order.paymentStatus === "pending") {
      return {
        priority: perspective === "restaurant" ? "High" : "Normal",
        score: perspective === "restaurant" ? 60 : 35,
        reason: perspective === "restaurant"
          ? "Delivered: Payment pending verification"
          : "Delivered: Awaiting payment settlement",
        badgeColor: perspective === "restaurant" ? "amber" : "blue",
        category: "PAYMENT_PENDING",
        estimatedDelivery,
        actionNeeded: perspective === "restaurant",
      };
    }

    return {
      priority: "Low",
      score: 10,
      reason: "Completed and settled",
      badgeColor: "gray",
      category: "COMPLETED",
      estimatedDelivery,
      actionNeeded: false,
    };
  }

  // 5. CANCELLED OR REJECTED
  return {
    priority: "Low",
    score: 5,
    reason: `Order ${order.orderStatus}`,
    badgeColor: "gray",
    category: "CLOSED",
    estimatedDelivery,
    actionNeeded: false,
  };
};

/**
 * Prioritizes orders for a restaurant.
 */
const prioritizeRestaurantOrders = async (restaurantId) => {
  const orders = await Order.find({ restaurant: restaurantId })
    .populate("supplier", "name email")
    .populate("product", "name category unit price")
    .sort({ createdAt: -1 });

  const prioritized = orders.map((order) => {
    const priorityInfo = evaluateOrderPriority(order, "restaurant");
    return {
      ...order.toObject(),
      priority: priorityInfo.priority,
      priorityScore: priorityInfo.score,
      priorityReason: priorityInfo.reason,
      priorityBadgeColor: priorityInfo.badgeColor,
      priorityCategory: priorityInfo.category,
      actionNeeded: priorityInfo.actionNeeded,
    };
  });

  // Sort by priorityScore descending, then createdAt descending
  prioritized.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return prioritized;
};

/**
 * Prioritizes orders for a supplier.
 */
const prioritizeSupplierOrders = async (supplierId) => {
  const orders = await Order.find({ supplier: supplierId })
    .populate("restaurant", "name email")
    .populate("product", "name category unit price")
    .sort({ createdAt: -1 });

  const prioritized = orders.map((order) => {
    const priorityInfo = evaluateOrderPriority(order, "supplier");
    return {
      ...order.toObject(),
      priority: priorityInfo.priority,
      priorityScore: priorityInfo.score,
      priorityReason: priorityInfo.reason,
      priorityBadgeColor: priorityInfo.badgeColor,
      priorityCategory: priorityInfo.category,
      actionNeeded: priorityInfo.actionNeeded,
    };
  });

  // Sort by priorityScore descending, then createdAt descending
  prioritized.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return prioritized;
};

module.exports = {
  evaluateOrderPriority,
  prioritizeRestaurantOrders,
  prioritizeSupplierOrders,
};

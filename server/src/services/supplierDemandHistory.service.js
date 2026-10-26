const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");

/**
 * Normalizes a product name for reliable matching.
 * e.g., "  fresh cow milk  " -> "Fresh Cow Milk"
 */
const normalizeProductName = (name = "") => {
  if (!name || typeof name !== "string") return "Unknown Product";
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Standardizes measurement units for comparison.
 */
const normalizeUnit = (unit = "") => {
  if (!unit || typeof unit !== "string") return "unit";
  return unit.trim();
};

/**
 * Aggregates supplier-specific demand history across all eligible restaurant purchases.
 * 
 * Rules enforced:
 * - Scoped strictly to the authenticated supplierId (strict supplier data isolation).
 * - Excludes cancelled and rejected orders, as well as failed or refunded payments.
 * - Distinguishes delivered purchases (fulfilled demand) from in-flight orders (committed demand).
 * - Enforces measurement unit integrity: never combines incompatible units (e.g., kg vs pieces).
 * - DATA PRIVACY: Strips all restaurant identities, private RFQs, and quotations.
 * - Handles active catalog products, unlinked orders, and products with zero orders safely.
 *
 * @param {string|mongoose.Types.ObjectId} supplierId
 * @returns {Promise<Array<object>>} Grouped demand history per supplier product
 */
const getSupplierDemandHistory = async (supplierId) => {
  if (!supplierId || !mongoose.Types.ObjectId.isValid(supplierId)) {
    const error = new Error("Valid supplier ID is required");
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch all catalog products listed by this supplier
  const supplierProducts = await Product.find({ supplier: supplierId }).lean();

  // Map keyed by product ID string
  const productMap = new Map();

  for (const prod of supplierProducts) {
    const prodId = prod._id.toString();
    productMap.set(prodId, {
      productId: prodId,
      name: normalizeProductName(prod.name),
      category: prod.category || "General",
      unit: prod.unit,
      price: prod.price,
      currentStock: Number(prod.stock) || 0,
      deliveredOrders: [],
      inFlightOrders: [],
    });
  }

  // 2. Fetch all valid orders placed with this supplier across restaurants
  const rawOrders = await Order.find({
    supplier: supplierId,
    orderStatus: { $nin: ["cancelled", "rejected"] },
    paymentStatus: { $nin: ["failed", "refunded"] },
  })
    .sort({ createdAt: 1 })
    .lean();

  if (!rawOrders || rawOrders.length === 0) {
    // Return all catalog products with zero orders
    return Array.from(productMap.values());
  }

  // Unlinked orders container (e.g. if a product was deleted or modified)
  const unlinkedMap = new Map();

  for (const order of rawOrders) {
    // Validate quantity
    const quantity = Number(order.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      continue; // Skip invalid or non-positive quantity records
    }

    // Determine valid order timestamp
    const orderDate = order.deliveredAt
      ? new Date(order.deliveredAt)
      : order.createdAt
      ? new Date(order.createdAt)
      : null;

    if (!orderDate || isNaN(orderDate.getTime())) {
      continue; // Skip corrupted timestamps
    }

    const isDelivered = order.orderStatus === "delivered";

    // Strip restaurant identity to preserve tenant privacy
    const orderRecord = {
      orderId: order._id.toString(),
      orderStatus: order.orderStatus,
      quantity,
      agreedPrice: Number(order.agreedPrice) || 0,
      totalAmount: Number(order.totalAmount) || 0,
      orderDate,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : null,
      createdAt: order.createdAt ? new Date(order.createdAt) : orderDate,
    };

    // Attempt to match order to supplier's active catalog product
    let targetProduct = null;
    const orderProdId = order.product ? order.product.toString() : null;

    if (orderProdId && productMap.has(orderProdId)) {
      targetProduct = productMap.get(orderProdId);
    } else {
      // Fallback matching by normalized name and unit among supplier's products
      const normOrderName = normalizeProductName(order.productName);
      const normOrderUnit = normalizeUnit(order.unit);

      for (const prod of productMap.values()) {
        if (
          normalizeProductName(prod.name) === normOrderName &&
          normalizeUnit(prod.unit) === normOrderUnit
        ) {
          targetProduct = prod;
          break;
        }
      }
    }

    if (targetProduct) {
      if (isDelivered) {
        targetProduct.deliveredOrders.push(orderRecord);
      } else {
        targetProduct.inFlightOrders.push(orderRecord);
      }
    } else {
      // Historical order exists for a product no longer in active catalog
      const normName = normalizeProductName(order.productName);
      const normUnit = normalizeUnit(order.unit);
      const unlinkedKey = `${normName.toLowerCase()}::${normUnit.toLowerCase()}`;

      if (!unlinkedMap.has(unlinkedKey)) {
        unlinkedMap.set(unlinkedKey, {
          productId: orderProdId || unlinkedKey,
          name: normName,
          category: "General",
          unit: normUnit,
          price: Number(order.agreedPrice) || 0,
          currentStock: 0,
          isArchivedOrUnlisted: true,
          deliveredOrders: [],
          inFlightOrders: [],
        });
      }

      const unlinkedGroup = unlinkedMap.get(unlinkedKey);
      if (isDelivered) {
        unlinkedGroup.deliveredOrders.push(orderRecord);
      } else {
        unlinkedGroup.inFlightOrders.push(orderRecord);
      }
    }
  }

  // Combine active catalog products and unlinked historical products
  const combined = [...Array.from(productMap.values()), ...Array.from(unlinkedMap.values())];

  // Sort orders chronologically for each product
  for (const item of combined) {
    item.deliveredOrders.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
    item.inFlightOrders.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
  }

  return combined;
};

module.exports = {
  normalizeProductName,
  normalizeUnit,
  getSupplierDemandHistory,
};

const mongoose = require("mongoose");
const Product = require("../models/product.model");
const Order = require("../models/order.model");

/**
 * Configurable complementary-product domain rules.
 * Maps product name and category keywords to logical companion items.
 */
const COMPLEMENTARY_RULES = [
  {
    triggers: ["milk", "dairy", "cream"],
    complements: ["cheese", "butter", "cream", "paneer", "yogurt", "bread", "eggs"],
    relatedCategories: ["Dairy", "Bakery"],
  },
  {
    triggers: ["bread", "bun", "bakery", "croissant"],
    complements: ["butter", "jam", "cheese", "mayonnaise", "eggs", "milk"],
    relatedCategories: ["Bakery", "Dairy"],
  },
  {
    triggers: ["rice", "basmati", "grain"],
    complements: ["lentils", "dal", "cooking oil", "oil", "spices", "ghee", "flour", "onions"],
    relatedCategories: ["Grains", "Spices", "Pantry", "Vegetables"],
  },
  {
    triggers: ["tomato", "tomatoes"],
    complements: ["onions", "garlic", "ginger", "potatoes", "cooking oil", "chili"],
    relatedCategories: ["Vegetables", "Spices"],
  },
  {
    triggers: ["onion", "onions"],
    complements: ["tomatoes", "potatoes", "garlic", "ginger", "cooking oil", "spices"],
    relatedCategories: ["Vegetables", "Spices"],
  },
  {
    triggers: ["potato", "potatoes"],
    complements: ["onions", "tomatoes", "cooking oil", "peas", "spices"],
    relatedCategories: ["Vegetables", "Spices"],
  },
  {
    triggers: ["cheese", "mozzarella", "cheddar", "paneer"],
    complements: ["butter", "milk", "bread", "pasta", "tomatoes", "sauce"],
    relatedCategories: ["Dairy", "Bakery"],
  },
  {
    triggers: ["pasta", "noodles"],
    complements: ["cheese", "olive oil", "oil", "tomatoes", "sauce", "garlic"],
    relatedCategories: ["Grains", "Dairy", "Vegetables"],
  },
  {
    triggers: ["coffee", "tea"],
    complements: ["sugar", "milk", "cream", "honey"],
    relatedCategories: ["Beverages", "Dairy"],
  },
  {
    triggers: ["chicken", "meat", "mutton", "fish"],
    complements: ["spices", "cooking oil", "garlic", "ginger", "onions", "rice"],
    relatedCategories: ["Meat", "Spices", "Vegetables"],
  },
  {
    triggers: ["oil", "ghee", "butter"],
    complements: ["spices", "flour", "rice", "onions", "lentils", "salt"],
    relatedCategories: ["Pantry", "Spices", "Grains"],
  },
  {
    triggers: ["flour", "atta", "maida"],
    complements: ["oil", "ghee", "sugar", "yeast", "butter", "rice"],
    relatedCategories: ["Grains", "Pantry", "Bakery"],
  },
];

/**
 * Finds complementary keyword matches for a given product name or category.
 */
const findRuleComplements = (productName = "", category = "") => {
  const normName = productName.toLowerCase();
  const normCat = category.toLowerCase();

  const matchedKeywords = new Set();
  const matchedCategories = new Set();

  for (const rule of COMPLEMENTARY_RULES) {
    const isTriggerMatch = rule.triggers.some(
      (trigger) => normName.includes(trigger) || normCat.includes(trigger)
    );
    if (isTriggerMatch) {
      rule.complements.forEach((item) => matchedKeywords.add(item));
      rule.relatedCategories.forEach((cat) => matchedCategories.add(cat));
    }
  }

  return {
    keywords: Array.from(matchedKeywords),
    relatedCategories: Array.from(matchedCategories),
  };
};

/**
 * Discovers genuine co-purchase patterns from historical valid orders.
 * Never fabricates data; returns empty if history is insufficient.
 */
const findCoPurchases = async (targetProductId, targetProductName, excludeProductIds = []) => {
  try {
    const targetOrders = await Order.find({
      $or: [
        { product: targetProductId },
        { productName: new RegExp(`^${targetProductName}$`, "i") },
      ],
      orderStatus: { $in: ["confirmed", "preparing", "out_for_delivery", "delivered"] },
    })
      .select("restaurant")
      .limit(100);

    if (!targetOrders || targetOrders.length === 0) {
      return [];
    }

    const restaurantIds = [...new Set(targetOrders.map((o) => o.restaurant.toString()))];

    const companionOrders = await Order.find({
      restaurant: { $in: restaurantIds },
      product: { $nin: [targetProductId, ...excludeProductIds] },
      orderStatus: { $in: ["confirmed", "preparing", "out_for_delivery", "delivered"] },
    })
      .select("product")
      .limit(200);

    if (!companionOrders || companionOrders.length === 0) {
      return [];
    }

    const frequencyMap = new Map();
    for (const order of companionOrders) {
      if (order.product) {
        const pId = order.product.toString();
        frequencyMap.set(pId, (frequencyMap.get(pId) || 0) + 1);
      }
    }

    const sortedProductIds = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pId]) => pId);

    if (sortedProductIds.length === 0) {
      return [];
    }

    return await Product.find({
      _id: { $in: sortedProductIds },
      stock: { $gt: 0 },
    }).populate("supplier", "name email");
  } catch (error) {
    return [];
  }
};

/**
 * Deduplicates products by product name (case-insensitive) to ensure diverse,
 * high-utility suggestions without redundant listings of the same product.
 */
const deduplicateByProductName = (products = [], targetProductName = "") => {
  const seen = new Set();
  const normalizedTarget = (targetProductName || "").trim().toLowerCase();

  return products.filter((product) => {
    const norm = (product.name || "").trim().toLowerCase();
    if (norm === normalizedTarget) {
      return false;
    }
    if (seen.has(norm)) {
      return false;
    }
    seen.add(norm);
    return true;
  });
};

/**
 * Core recommendation method following the 3-tier fallback hierarchy:
 * 1. Configurable complementary product relationships
 * 2. Related categories fallback
 * 3. Genuine co-purchase patterns from historical orders
 */
const getRecommendations = async ({ productId, query, limit = 6 }) => {
  const effectiveLimit = Math.min(Math.max(Number(limit) || 6, 1), 20);

  let targetProduct = null;
  let targetName = "";
  let targetCategory = "";
  const excludeIds = [];

  if (productId) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const err = new Error("Invalid product ID.");
      err.statusCode = 400;
      throw err;
    }
    targetProduct = await Product.findById(productId).populate("supplier", "name email");
    if (!targetProduct) {
      const err = new Error("Product not found.");
      err.statusCode = 404;
      throw err;
    }
    targetName = targetProduct.name;
    targetCategory = targetProduct.category;
    excludeIds.push(targetProduct._id);
  } else if (query && typeof query === "string" && query.trim()) {
    targetName = query.trim();
    const matchedProduct = await Product.findOne({
      name: new RegExp(`^${targetName}$`, "i"),
    });
    if (matchedProduct) {
      targetProduct = matchedProduct;
      targetCategory = matchedProduct.category;
      excludeIds.push(matchedProduct._id);
    }
  }

  const results = [];
  const addedIds = new Set(excludeIds.map((id) => id.toString()));
  let activeBasis = "complementary";

  // Tier 1: Configured Complementary Relationships
  const { keywords, relatedCategories } = findRuleComplements(targetName, targetCategory);

  if (keywords.length > 0) {
    const regexList = keywords.map((k) => new RegExp(k, "i"));
    const complementaryListings = await Product.find({
      _id: { $nin: Array.from(addedIds) },
      stock: { $gt: 0 },
      $or: [
        { name: { $in: regexList } },
        { category: { $in: relatedCategories } },
      ],
    })
      .populate("supplier", "name email")
      .sort({ stock: -1, price: 1 })
      .limit(effectiveLimit * 2);

    for (const prod of complementaryListings) {
      const idStr = prod._id.toString();
      if (!addedIds.has(idStr)) {
        addedIds.add(idStr);
        results.push({
          ...prod.toObject(),
          recommendationBasis: "complementary",
          relevanceScore: 90,
        });
      }
    }
  }

  // Tier 2: Genuine Co-Purchase Patterns from Historical Orders
  if (results.length < effectiveLimit && targetProduct) {
    const coPurchasedListings = await findCoPurchases(
      targetProduct._id,
      targetName,
      Array.from(addedIds)
    );

    for (const prod of coPurchasedListings) {
      const idStr = prod._id.toString();
      if (!addedIds.has(idStr)) {
        addedIds.add(idStr);
        results.push({
          ...prod.toObject(),
          recommendationBasis: "co_purchase",
          relevanceScore: 80,
        });
        if (results.length === 1 && activeBasis === "complementary") {
          activeBasis = "co_purchase";
        }
      }
    }
  }

  // Tier 3: Related Categories Fallback (when complementary/co-purchases are insufficient)
  if (results.length < effectiveLimit) {
    const categoryFilter = targetCategory
      ? { category: targetCategory }
      : relatedCategories.length > 0
      ? { category: { $in: relatedCategories } }
      : {};

    const fallbackListings = await Product.find({
      _id: { $nin: Array.from(addedIds) },
      stock: { $gt: 0 },
      ...categoryFilter,
    })
      .populate("supplier", "name email")
      .sort({ stock: -1, price: 1 })
      .limit(effectiveLimit - results.length + 5);

    for (const prod of fallbackListings) {
      const idStr = prod._id.toString();
      if (!addedIds.has(idStr)) {
        addedIds.add(idStr);
        results.push({
          ...prod.toObject(),
          recommendationBasis: "category_fallback",
          relevanceScore: 50,
        });
        if (results.length === 1) {
          activeBasis = "category_fallback";
        }
      }
    }
  }

  // General fallback: Any active products if target category is empty or exhausted
  if (results.length < effectiveLimit) {
    const generalListings = await Product.find({
      _id: { $nin: Array.from(addedIds) },
      stock: { $gt: 0 },
    })
      .populate("supplier", "name email")
      .sort({ stock: -1, price: 1 })
      .limit(effectiveLimit - results.length);

    for (const prod of generalListings) {
      const idStr = prod._id.toString();
      if (!addedIds.has(idStr)) {
        addedIds.add(idStr);
        results.push({
          ...prod.toObject(),
          recommendationBasis: "category_fallback",
          relevanceScore: 30,
        });
      }
    }
  }

  const dedupedResults = deduplicateByProductName(results, targetName).slice(
    0,
    effectiveLimit
  );

  return {
    target: targetProduct
      ? {
          _id: targetProduct._id,
          name: targetProduct.name,
          category: targetProduct.category,
        }
      : {
          name: targetName || "All Products",
          category: targetCategory || null,
        },
    basis: dedupedResults[0]?.recommendationBasis || activeBasis,
    count: dedupedResults.length,
    recommendations: dedupedResults,
  };
};

module.exports = {
  getRecommendations,
  COMPLEMENTARY_RULES,
  findRuleComplements,
};

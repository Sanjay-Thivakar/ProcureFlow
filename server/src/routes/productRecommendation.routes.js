const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const {
  getProductRecommendations,
  getContextRecommendations,
} = require("../controllers/productRecommendation.controller");

// Contextual recommendations: GET /api/recommendations?query=...&productId=...
router.get("/", protect, authorize("restaurant"), getContextRecommendations);

// Specific product recommendations: GET /api/recommendations/:id
router.get("/:id", protect, authorize("restaurant"), getProductRecommendations);

module.exports = router;

const express = require("express");
const router = express.Router();
const { getRecommendations } = require("../controllers/smartReplenishment.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All smart replenishment routes require JWT authentication and supplier role authorization
router.use(protect);
router.use(authorize("supplier"));

// GET /api/replenishment/recommendations
router.get("/recommendations", getRecommendations);

module.exports = router;

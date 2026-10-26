const express = require("express");
const router = express.Router();

const {
  getRankedQuotations,
  getPrioritizedRFQs,
  getPrioritizedOrders,
} = require("../controllers/procurementRanking.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

// All procurement ranking routes require valid JWT authentication
router.use(protect);

// 1. Quotation Ranking for an RFQ (Restaurant only - prevents suppliers seeing competing bids)
router.get("/quotations/:rfqId", authorize("restaurant"), getRankedQuotations);

// 2. RFQ Prioritization (Accessible to restaurants and suppliers with role-based partitioning)
router.get("/rfqs", authorize("restaurant", "supplier"), getPrioritizedRFQs);

// 3. Order Prioritization (Accessible to restaurants and suppliers with role-based partitioning)
router.get("/orders", authorize("restaurant", "supplier"), getPrioritizedOrders);

module.exports = router;

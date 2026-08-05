const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { createRFQ,getSupplierQuotations,respondToQuotation,acceptQuotation,rejectQuotation,getRestaurantQuotations } = require("../controllers/quotation.controller");

router.post("/", protect, createRFQ);
router.get("/supplier", protect, getSupplierQuotations);
router.get("/restaurant", protect, getRestaurantQuotations);
router.put("/:id/respond", protect, respondToQuotation);
router.put("/:id/accept", protect, acceptQuotation);

router.put("/:id/reject", protect, rejectQuotation);

module.exports = router;
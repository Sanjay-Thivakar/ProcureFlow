const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const { createQuotation,getSellerQuotations,respondToQuotation,acceptQuotation,rejectQuotation,getBuyerQuotations } = require("../controllers/quotation.controller");

router.post("/", protect, createQuotation);
router.get("/seller", protect, getSellerQuotations);
router.get("/buyer", protect, getBuyerQuotations);
router.put("/:id/respond", protect, respondToQuotation);
router.put("/:id/accept", protect, acceptQuotation);

router.put("/:id/reject", protect, rejectQuotation);

module.exports = router;
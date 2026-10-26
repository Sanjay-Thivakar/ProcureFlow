const express = require("express");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");
const {
    createRFQ,
    getSupplierQuotations,
    respondToQuotation,
    acceptQuotation,
    rejectQuotation,
    getRestaurantQuotations,
} = require("../controllers/quotation.controller");

router.post("/", protect, authorize("restaurant"), createRFQ);
router.get("/supplier", protect, authorize("supplier"), getSupplierQuotations);
router.get("/restaurant", protect, authorize("restaurant"), getRestaurantQuotations);
router.put("/:id/respond", protect, authorize("supplier"), respondToQuotation);
router.put("/:id/accept", protect, authorize("restaurant"), acceptQuotation);
router.put("/:id/reject", protect, authorize("restaurant"), rejectQuotation);

module.exports = router;
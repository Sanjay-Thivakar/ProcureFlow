const express = require("express");

const router = express.Router();

const {
    createPaymentOrder,
    verifyPayment,
} = require("../controllers/payment.controller");

const { protect, authorize } = require("../middleware/auth.middleware");

// Create Razorpay order
router.post(
    "/:id/create",
    protect,
    authorize("restaurant"),
    createPaymentOrder
);

// Verify Razorpay payment
router.post(
    "/verify",
    protect,
    authorize("restaurant"),
    verifyPayment
);

module.exports = router;
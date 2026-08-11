const express = require("express");

const router = express.Router();

const {
    createPaymentOrder,
    verifyPayment,
} = require("../controllers/payment.controller");

const { protect } = require("../middleware/auth.middleware");

// Create Razorpay order
router.post(
    "/:id/create",
    protect,
    createPaymentOrder
);

// Verify Razorpay payment
router.post(
    "/verify",
    protect,
    verifyPayment
);

module.exports = router;
const crypto = require("crypto");
const Payment = require("../models/payment.model");
const Order = require("../models/order.model");
const razorpay = require("../config/razorpay");
const { runInTransaction } = require("../utils/transaction");

const createPaymentOrder = async (req, res) => {
    try {
        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can initiate payments.",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found.",
            });
        }

        if (order.restaurant.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized.",
            });
        }

        if (order.orderStatus !== "delivered") {
            return res.status(400).json({
                success: false,
                message: "Payment can only be made after delivery.",
            });
        }

        if (order.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Order has already been paid.",
            });
        }

        const options = {
            amount: Math.round(order.totalAmount * 100),
            currency: "INR",
            receipt: `order_${order._id}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        const payment = await Payment.create({
            order: order._id,
            restaurant: order.restaurant,
            supplier: order.supplier,
            amount: order.totalAmount,
            paymentMethod: "razorpay",
            razorpayOrderId: razorpayOrder.id,
            paymentStatus: "pending",
        });

        return res.status(200).json({
            success: true,
            razorpayOrder,
            paymentId: payment._id,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create payment order.",
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can verify payments.",
            });
        }

        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
        } = req.body;

        if (
            !razorpay_payment_id ||
            !razorpay_order_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment verification details are required.",
            });
        }

        const payment = await Payment.findOne({
            razorpayOrderId: razorpay_order_id,
        });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found.",
            });
        }

        if (payment.restaurant.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Not authorized.",
            });
        }

        // Duplicate payment attempt prevention
        if (payment.paymentStatus === "paid") {
            return res.status(400).json({
                success: false,
                message: "Payment has already been verified and paid.",
            });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({
                success: false,
                message: "Payment gateway configuration error.",
            });
        }

        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        let isValid = false;
        try {
            const genBuf = Buffer.from(generatedSignature, "hex");
            const sigBuf = Buffer.from(razorpay_signature, "hex");
            if (genBuf.length === sigBuf.length && genBuf.length > 0) {
                isValid = crypto.timingSafeEqual(genBuf, sigBuf);
            }
        } catch (_) {
            isValid = false;
        }

        if (!isValid) {
            payment.paymentStatus = "failed";
            await payment.save();

            return res.status(400).json({
                success: false,
                message: "Payment verification failed.",
            });
        }

        // Atomic update of Payment and Order
        const result = await runInTransaction(async (session) => {
            const opts = session ? { session } : {};

            const updatedPayment = await Payment.findOneAndUpdate(
                {
                    _id: payment._id,
                    paymentStatus: { $ne: "paid" },
                },
                {
                    $set: {
                        razorpayPaymentId: razorpay_payment_id,
                        razorpaySignature: razorpay_signature,
                        transactionId: razorpay_payment_id,
                        paymentStatus: "paid",
                        paidAt: new Date(),
                    },
                },
                { returnDocument: "after", ...opts }
            );

            if (!updatedPayment) {
                throw new Error("Payment has already been processed.");
            }

            const updatedOrder = await Order.findByIdAndUpdate(
                payment.order,
                {
                    $set: { paymentStatus: "paid" },
                },
                { returnDocument: "after", ...opts }
            );

            return { payment: updatedPayment, order: updatedOrder };
        });

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            payment: result.payment,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Payment verification failed.",
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment,
};
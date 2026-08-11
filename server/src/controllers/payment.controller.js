const crypto = require("crypto");

const Payment = require("../models/payment.model");
const Order = require("../models/order.model");

const razorpay = require("../config/razorpay");

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

            amount: order.totalAmount * 100,

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

        console.error("Create Payment Error:", error);

        return res.status(500).json({

            success: false,

            message: "Failed to create payment order.",

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

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        const isValid = crypto.timingSafeEqual(
            Buffer.from(generatedSignature, "hex"),
            Buffer.from(razorpay_signature, "hex")
        );

        if (!isValid) {

            payment.paymentStatus = "failed";

            await payment.save();

            return res.status(400).json({

                success: false,

                message: "Payment verification failed.",

            });

        }

        payment.razorpayPaymentId = razorpay_payment_id;

        payment.razorpaySignature = razorpay_signature;

        payment.transactionId = razorpay_payment_id;

        payment.paymentStatus = "paid";

        payment.paidAt = new Date();

        await payment.save();

        const order = await Order.findById(payment.order);

        if (order) {

            order.paymentStatus = "paid";

            await order.save();

        }

        return res.status(200).json({

            success: true,

            message: "Payment verified successfully.",

            payment,

        });

    } catch (error) {

        console.error("Verify Payment Error:", error);

        return res.status(500).json({

            success: false,

            message: "Payment verification failed.",

        });

    }

};



module.exports = {
    createPaymentOrder,
    verifyPayment,
};
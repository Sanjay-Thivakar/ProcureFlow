const Order = require("../models/order.model");
const Product = require("../models/product.model");

const getSupplierOrders = async (req, res) => {

    try {

        // Only suppliers can view their orders
        if (req.user.role !== "supplier") {

            return res.status(403).json({

                success: false,

                message: "Only suppliers can view their orders."

            });

        }

        const orders = await Order.find({

            supplier: req.user.id,

        })
        .populate("restaurant", "name email")
        .populate("product", "name category unit");

        return res.status(200).json({

            success: true,

            count: orders.length,

            orders,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

const acceptOrder = async (req, res) => {

    try {

        // Only suppliers can accept orders
        if (req.user.role !== "supplier") {

            return res.status(403).json({
                success: false,
                message: "Only suppliers can accept orders."
            });

        }

        // Find the order
        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        // Verify ownership
        if (order.supplier.toString() !== req.user.id) {

            return res.status(403).json({
                success: false,
                message: "Not authorized."
            });

        }

        // Order must still be waiting
        if (order.orderStatus !== "pending_supplier_confirmation") {

            return res.status(400).json({
                success: false,
                message: "Order has already been processed."
            });

        }

        // Find the product
        const product = await Product.findById(order.product);

        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }

        // Check inventory
        if (product.stock < order.quantity) {

            return res.status(400).json({
                success: false,
                message: "Insufficient stock available."
            });

        }

        // Deduct stock
        product.stock -= order.quantity;

        await product.save();

        // Confirm order
        order.orderStatus = "confirmed";

        await order.save();

        return res.status(200).json({

            success: true,

            message: "Order accepted successfully.",

            order,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

const rejectOrder = async (req, res) => {

    try {

        // Only suppliers can reject orders
        if (req.user.role !== "supplier") {

            return res.status(403).json({
                success: false,
                message: "Only suppliers can reject orders."
            });

        }

        // Find order
        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        // Verify ownership
        if (order.supplier.toString() !== req.user.id) {

            return res.status(403).json({
                success: false,
                message: "Not authorized."
            });

        }

        // Only pending orders can be rejected
        if (order.orderStatus !== "pending_supplier_confirmation") {

            return res.status(400).json({
                success: false,
                message: "Order has already been processed."
            });

        }

        // Reject order
        order.orderStatus = "rejected";

        await order.save();

        return res.status(200).json({

            success: true,

            message: "Order rejected successfully.",

            order,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

const updateOrderStatus = async (req, res) => {

    try {

        if (req.user.role !== "supplier") {

            return res.status(403).json({
                success: false,
                message: "Only suppliers can update order status."
            });

        }

        const order = await Order.findById(req.params.id);

        if (!order) {

            return res.status(404).json({
                success: false,
                message: "Order not found."
            });

        }

        if (order.supplier.toString() !== req.user.id) {

            return res.status(403).json({
                success: false,
                message: "Not authorized."
            });

        }

        const { orderStatus } = req.body;

        const validTransitions = {

            confirmed: ["preparing"],

            preparing: ["out_for_delivery"],

            out_for_delivery: ["delivered"],

        };

        const allowedStatuses =
            validTransitions[order.orderStatus] || [];

        if (!allowedStatuses.includes(orderStatus)) {

            return res.status(400).json({

                success: false,

                message: `Cannot change status from ${order.orderStatus} to ${orderStatus}.`

            });

        }

        order.orderStatus = orderStatus;

        await order.save();

        return res.status(200).json({

            success: true,

            message: "Order status updated successfully.",

            order,

        });

    } catch (error) {

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};

const getRestaurantOrders = async (req, res) => {
    try {

        if (req.user.role !== "restaurant") {
            return res.status(403).json({
                success: false,
                message: "Only restaurants can view their orders."
            });
        }

        const orders = await Order.find({
            restaurant: req.user.id,
        })
            .populate("supplier", "name")
            .populate("restaurant", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

module.exports = {

    getSupplierOrders,
    acceptOrder,
    rejectOrder,
    getRestaurantOrders,
    updateOrderStatus,
};
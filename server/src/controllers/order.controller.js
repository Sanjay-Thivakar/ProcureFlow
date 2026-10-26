const Order = require("../models/order.model");
const Product = require("../models/product.model");
const { runInTransaction } = require("../utils/transaction");

const getSupplierOrders = async (req, res) => {
    try {
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
        .populate("product", "name category unit")
        .sort({ createdAt: -1 });

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
        if (req.user.role !== "supplier") {
            return res.status(403).json({
                success: false,
                message: "Only suppliers can accept orders."
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

        if (order.orderStatus !== "pending_supplier_confirmation") {
            return res.status(400).json({
                success: false,
                message: "Order has already been processed."
            });
        }

        // Atomic stock deduction & status transition
        const confirmedOrder = await runInTransaction(async (session) => {
            const opts = session ? { session } : {};

            // Atomically check and deduct stock from product
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id: order.product,
                    stock: { $gte: order.quantity },
                },
                {
                    $inc: { stock: -order.quantity },
                },
                { returnDocument: "after", ...opts }
            );

            if (!updatedProduct) {
                throw new Error("Insufficient stock available.");
            }

            // Atomically update order status
            const updatedOrder = await Order.findOneAndUpdate(
                {
                    _id: order._id,
                    orderStatus: "pending_supplier_confirmation",
                },
                {
                    $set: { orderStatus: "confirmed" },
                },
                { returnDocument: "after", ...opts }
            );

            if (!updatedOrder) {
                // If not in transaction mode, compensate by restoring product stock
                if (!session) {
                    await Product.findByIdAndUpdate(order.product, {
                        $inc: { stock: order.quantity },
                    });
                }
                throw new Error("Order has already been processed.");
            }

            return updatedOrder;
        });

        return res.status(200).json({
            success: true,
            message: "Order accepted successfully.",
            order: confirmedOrder,
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to accept order.",
        });
    }
};

const rejectOrder = async (req, res) => {
    try {
        if (req.user.role !== "supplier") {
            return res.status(403).json({
                success: false,
                message: "Only suppliers can reject orders."
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

        if (order.orderStatus !== "pending_supplier_confirmation") {
            return res.status(400).json({
                success: false,
                message: "Order has already been processed."
            });
        }

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

        const allowedStatuses = validTransitions[order.orderStatus] || [];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${order.orderStatus} to ${orderStatus}.`
            });
        }

        order.orderStatus = orderStatus;
        if (orderStatus === "delivered" && !order.deliveredAt) {
            order.deliveredAt = new Date();
        }
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
            .populate("supplier", "name email")
            .populate("restaurant", "name email")
            .populate("product", "name category unit")
            .sort({ createdAt: -1 });

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

module.exports = {
    getSupplierOrders,
    acceptOrder,
    rejectOrder,
    getRestaurantOrders,
    updateOrderStatus,
};
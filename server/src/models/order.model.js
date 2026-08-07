const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        rfq: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RFQ",
            required: true,
        },

        quotation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quotation",
            required: true,
        },

        restaurant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        productName: {
            type: String,
            required: true,
            trim: true,
        },

        unit: {
            type: String,
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
        },

        agreedPrice: {
            type: Number,
            required: true,
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        estimatedDelivery: {
            type: Date,
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "refunded",
            ],
            default: "pending",
        },

        orderStatus: {
            type: String,
            enum: [
                "pending_supplier_confirmation",
                "confirmed",
                "preparing",
                "out_for_delivery",
                "delivered",
                "cancelled",
            ],
            default: "pending_supplier_confirmation",
        },
        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "pending"
        }  
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);
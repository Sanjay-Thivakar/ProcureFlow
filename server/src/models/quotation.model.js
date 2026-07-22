const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    requiredBy: {
        type: Date,
        required: true
    },

    message: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "quoted",
        "accepted",
        "rejected",
        "expired"
      ],
      default: "pending",
    },

    quotedPrice: {
      type: Number,
    },

    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    estimatedDelivery: {
      type: String,
    },

    sellerNote: {
      type: String,
    },

    validUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quotation", quotationSchema);
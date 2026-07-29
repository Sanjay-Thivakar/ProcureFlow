const mongoose = require("mongoose");

const quotationSchema = new mongoose.Schema(
  {
    restaurant : {
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
      trim: true,
    },

    listedPrice: {
      type: Number,
      required: true,
      min: 0,
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
        "declined",
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
      type: Date,
    },

    supplierNote: {
      type: String,
      trim: true,
      default: "",
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
const mongoose = require("mongoose");

const rfqSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productListings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    }],

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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    requiredBy: {
      type: Date,
      required: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "open",
        "closed",
        "completed",
        "cancelled",
      ],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RFQ", rfqSchema);
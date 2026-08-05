const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
        type: String,
        required: true,
        trim: true,
        set: value =>
            value.trim().charAt(0).toUpperCase() +
            value.trim().slice(1).toLowerCase(),
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: String,
      required: true,
      enum: ["kg","g","L", "Piece","mL", "Box", "Pack","Dozen"],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can create products.",
      });
    }

    const { name, category, unit, price, stock } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product name is required.",
      });
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product category is required.",
      });
    }

    if (!unit || typeof unit !== "string" || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product unit is required.",
      });
    }

    const numPrice = Number(price);
    if (price === undefined || isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a non-negative number.",
      });
    }

    const numStock = Number(stock);
    if (stock === undefined || isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a non-negative integer.",
      });
    }

    const formattedName =
      name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

    const formattedCategory =
      category.trim().charAt(0).toUpperCase() + category.trim().slice(1).toLowerCase();

    const product = await Product.create({
      supplier: req.user.id,
      name: formattedName,
      category: formattedCategory,
      unit: unit.trim(),
      price: numPrice,
      stock: numStock,
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyProducts = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can view their products.",
      });
    }

    const products = await Product.find({
      supplier: req.user.id,
    }).populate("supplier", "name email");

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const browseProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("supplier", "name email");

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("supplier", "name email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can update products.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Explicitly allow only specified fields
    const updates = {};

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty.",
        });
      }
      updates.name =
        req.body.name.trim().charAt(0).toUpperCase() + req.body.name.trim().slice(1).toLowerCase();
    }

    if (req.body.category !== undefined) {
      if (typeof req.body.category !== "string" || !req.body.category.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product category cannot be empty.",
        });
      }
      updates.category =
        req.body.category.trim().charAt(0).toUpperCase() +
        req.body.category.trim().slice(1).toLowerCase();
    }

    if (req.body.unit !== undefined) {
      if (typeof req.body.unit !== "string" || !req.body.unit.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product unit cannot be empty.",
        });
      }
      updates.unit = req.body.unit.trim();
    }

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (isNaN(price) || price < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number.",
        });
      }
      updates.price = price;
    }

    if (req.body.stock !== undefined) {
      const stock = Number(req.body.stock);
      if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a non-negative integer.",
        });
      }
      updates.stock = stock;
    }

    // If no valid fields to update were supplied
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    ).populate("supplier", "name email");

    res.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can delete products.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.supplier.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getMyProducts,
  browseProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
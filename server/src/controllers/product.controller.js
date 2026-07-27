const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {

    if (req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Only suppliers can create products."
      });
    }

    const product = await Product.create({
      supplier: req.user.id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      product,
    });

  } catch (error) {
    console.error("Create Product error : ", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

const getAllProducts = async (req, res) => {

    const products = await Product.find({supplier: req.user.id})
        .populate("supplier", "name email");

    res.json(products);
};

//getting aproduct by its product id


const getProductById = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id)
            .populate("supplier", "name email");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            product
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

const updateProduct = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.supplier.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.json({
            success: true,
            product: updatedProduct
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

const deleteProduct = async (req, res) => {

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.supplier.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
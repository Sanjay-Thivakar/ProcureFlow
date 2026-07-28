const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
    createProduct,
    getMyProducts,
    getProductById,
    browseProducts,
    updateProduct,
    deleteProduct,
} = require("../controllers/product.controller");

router.post("/", protect, createProduct);

router.get("/", protect, browseProducts);

router.get("/my-products", protect, getMyProducts);

router.get("/:id", protect, getProductById);

router.put("/:id", protect, updateProduct);

router.delete("/:id", protect, deleteProduct);

module.exports = router;
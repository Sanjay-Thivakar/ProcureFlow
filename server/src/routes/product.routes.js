const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
} = require("../controllers/product.controller");

router.post("/", protect, createProduct);

router.get("/", getAllProducts);

router.get("/:id", getProductById);

router.put("/:id", protect, updateProduct);

router.delete("/:id", protect, deleteProduct);

module.exports = router;
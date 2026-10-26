const express = require("express");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    createProduct,
    getMyProducts,
    getProductById,
    browseProducts,
    updateProduct,
    deleteProduct,
} = require("../controllers/product.controller");

const {
    getProductRecommendations,
    getContextRecommendations,
} = require("../controllers/productRecommendation.controller");

// Recommendation routes (contextual before :id)
router.get("/recommendations", protect, authorize("restaurant"), getContextRecommendations);

router.post("/", protect, authorize("supplier"), createProduct);

router.get("/", protect, browseProducts);

router.get("/my-products", protect, authorize("supplier"), getMyProducts);

router.get("/:id/recommendations", protect, authorize("restaurant"), getProductRecommendations);

router.get("/:id", protect, getProductById);

router.put("/:id", protect, authorize("supplier"), updateProduct);

router.delete("/:id", protect, authorize("supplier"), deleteProduct);

module.exports = router;
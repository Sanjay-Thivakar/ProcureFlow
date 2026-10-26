const express = require("express");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    getSupplierOrders,
    acceptOrder,
    rejectOrder,
    getRestaurantOrders,
    updateOrderStatus,
} = require("../controllers/order.controller");

router.get("/supplier", protect, authorize("supplier"), getSupplierOrders);
router.patch("/:id/accept", protect, authorize("supplier"), acceptOrder);
router.patch("/:id/reject", protect, authorize("supplier"), rejectOrder);
router.get("/restaurant", protect, authorize("restaurant"), getRestaurantOrders);
router.patch("/:id/status", protect, authorize("supplier"), updateOrderStatus);

module.exports = router;
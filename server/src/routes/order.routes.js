const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {

    getSupplierOrders,

    acceptOrder,

    rejectOrder,

    getRestaurantOrders,

} = require("../controllers/order.controller");

router.get("/supplier", protect, getSupplierOrders);

router.patch("/:id/accept", protect, acceptOrder);

router.patch("/:id/reject", protect, rejectOrder);

router.get(
    "/restaurant",
    protect,
    getRestaurantOrders
);

module.exports = router;
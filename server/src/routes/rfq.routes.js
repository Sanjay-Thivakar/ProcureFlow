const express = require("express");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");

const {
    getRestaurantRFQs,
    getRFQDetails,
} = require("../controllers/rfq.controller");

router.get("/restaurant", protect, authorize("restaurant"), getRestaurantRFQs);

router.get("/:id", protect, getRFQDetails);

module.exports = router;
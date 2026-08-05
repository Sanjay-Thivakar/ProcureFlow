const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/auth.middleware");

const {
    getRestaurantRFQs,
    getRFQDetails,
} = require("../controllers/rfq.controller");

router.get("/restaurant", protect, getRestaurantRFQs);

router.get("/:id", protect, getRFQDetails);

module.exports = router;
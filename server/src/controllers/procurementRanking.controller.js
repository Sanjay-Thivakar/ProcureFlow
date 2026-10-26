const mongoose = require("mongoose");
const { rankQuotationsForRFQ } = require("../services/quotationRanking.service");
const { prioritizeRestaurantRFQs, prioritizeSupplierRFQs } = require("../services/rfqPriority.service");
const { prioritizeRestaurantOrders, prioritizeSupplierOrders } = require("../services/orderPriority.service");

/**
 * Controller for Quotation Ranking
 * GET /api/rankings/quotations/:rfqId
 * Only accessible to the restaurant that owns the RFQ.
 */
const getRankedQuotations = async (req, res) => {
  try {
    const { rfqId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(rfqId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid RFQ ID format",
      });
    }

    if (req.user.role !== "restaurant") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only restaurants can access quotation rankings.",
      });
    }

    const rankingResult = await rankQuotationsForRFQ(rfqId, req.user.id);

    return res.status(200).json({
      success: true,
      data: rankingResult,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to calculate quotation rankings",
    });
  }
};

/**
 * Controller for RFQ Prioritization
 * GET /api/rankings/rfqs
 * Dispatches to restaurant or supplier prioritization based on authenticated user role.
 */
const getPrioritizedRFQs = async (req, res) => {
  try {
    const { priority } = req.query;
    let rfqs = [];

    if (req.user.role === "restaurant") {
      rfqs = await prioritizeRestaurantRFQs(req.user.id);
    } else if (req.user.role === "supplier") {
      rfqs = await prioritizeSupplierRFQs(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: "Invalid user role for RFQ prioritization",
      });
    }

    if (priority) {
      rfqs = rfqs.filter((r) => r.priority.toLowerCase() === priority.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: rfqs.length,
      data: rfqs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to prioritize RFQs",
    });
  }
};

/**
 * Controller for Order Prioritization
 * GET /api/rankings/orders
 * Dispatches to restaurant or supplier order prioritization based on user role.
 */
const getPrioritizedOrders = async (req, res) => {
  try {
    const { priority } = req.query;
    let orders = [];

    if (req.user.role === "restaurant") {
      orders = await prioritizeRestaurantOrders(req.user.id);
    } else if (req.user.role === "supplier") {
      orders = await prioritizeSupplierOrders(req.user.id);
    } else {
      return res.status(403).json({
        success: false,
        message: "Invalid user role for Order prioritization",
      });
    }

    if (priority) {
      orders = orders.filter((o) => o.priority.toLowerCase() === priority.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to prioritize orders",
    });
  }
};

module.exports = {
  getRankedQuotations,
  getPrioritizedRFQs,
  getPrioritizedOrders,
};

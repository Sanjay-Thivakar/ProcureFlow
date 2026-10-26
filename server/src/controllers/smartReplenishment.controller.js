const {
  getSupplierReplenishmentRecommendations,
} = require("../services/smartReplenishment.service");

/**
 * Controller to fetch smart replenishment recommendations for the authenticated supplier.
 * GET /api/replenishment/recommendations
 */
const getRecommendations = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "supplier") {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Only supplier accounts can access supplier smart replenishment.",
      });
    }

    const { status, category, search } = req.query;

    const result = await getSupplierReplenishmentRecommendations(req.user.id, {
      status,
      category,
      search,
    });

    return res.status(200).json({
      success: true,
      count: result.recommendations.length,
      overview: result.overview,
      methodologyNote: result.methodologyNote,
      data: result.recommendations,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to calculate supplier replenishment recommendations.",
    });
  }
};

module.exports = {
  getRecommendations,
};

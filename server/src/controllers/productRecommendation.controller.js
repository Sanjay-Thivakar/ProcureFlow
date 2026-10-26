const productRecommendationService = require("../services/productRecommendation.service");

const getProductRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;

    const data = await productRecommendationService.getRecommendations({
      productId: id,
      limit: limit ? parseInt(limit, 10) : 6,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve product recommendations.",
    });
  }
};

const getContextRecommendations = async (req, res) => {
  try {
    const { productId, query, limit } = req.query;

    const data = await productRecommendationService.getRecommendations({
      productId,
      query,
      limit: limit ? parseInt(limit, 10) : 6,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to retrieve recommendations.",
    });
  }
};

module.exports = {
  getProductRecommendations,
  getContextRecommendations,
};

import api from "./api";

/**
 * Fetch smart replenishment recommendations and inventory demand analytics for the authenticated supplier.
 * @param {object} [params={}] - Optional query parameters ({ status, category, search })
 * @returns {Promise<{ success: boolean, count: number, overview: object, methodologyNote: string, data: Array }>}
 */
export const getSupplierReplenishmentRecommendations = async (params = {}) => {
  const response = await api.get("/replenishment/recommendations", { params });
  return response.data;
};

// Backwards-compatible alias
export const getReplenishmentRecommendations = getSupplierReplenishmentRecommendations;

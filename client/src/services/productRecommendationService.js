import api from "./api";

/**
 * Fetch complementary product recommendations for a specific product ID.
 * @param {string} productId 
 * @param {number} [limit=6] 
 * @returns {Promise<{success: boolean, target: object, basis: string, count: number, recommendations: Array}>}
 */
export const getProductRecommendations = async (productId, limit = 6) => {
  const { data } = await api.get(`/products/${productId}/recommendations`, {
    params: { limit },
  });
  return data;
};

/**
 * Fetch contextual recommendations based on search query or context.
 * @param {object} params - { query, productId, limit }
 * @returns {Promise<{success: boolean, target: object, basis: string, count: number, recommendations: Array}>}
 */
export const getContextRecommendations = async (params = {}) => {
  const { data } = await api.get("/products/recommendations", {
    params,
  });
  return data;
};

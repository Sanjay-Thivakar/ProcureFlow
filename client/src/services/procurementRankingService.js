import api from "./api";

/**
 * Fetch explainable quotation rankings for an RFQ.
 * Restricted to restaurant buyers.
 * @param {string} rfqId
 * @returns {Promise<{ success: boolean, data: { rfq: object, rankedQuotations: Array, summary: object } }>}
 */
export const getRankedQuotations = async (rfqId) => {
  const response = await api.get(`/rankings/quotations/${rfqId}`);
  return response.data;
};

/**
 * Fetch prioritized RFQs for the current authenticated user (restaurant or supplier).
 * @param {string} [priority] - Optional filter ('Urgent' | 'High' | 'Normal' | 'Low')
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getPrioritizedRFQs = async (priority) => {
  const params = priority ? { priority } : {};
  const response = await api.get("/rankings/rfqs", { params });
  return response.data;
};

/**
 * Fetch prioritized orders for the current authenticated user (restaurant or supplier).
 * @param {string} [priority] - Optional filter ('Urgent' | 'High' | 'Normal' | 'Low')
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getPrioritizedOrders = async (priority) => {
  const params = priority ? { priority } : {};
  const response = await api.get("/rankings/orders", { params });
  return response.data;
};

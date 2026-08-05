import api from "./api";

const RFQ_BASE = "/rfqs";
const CREATE_RFQ_ENDPOINT = "/quotations";

// Create RFQ
export const createRFQ = async (rfqData) => {

    const { data } = await api.post(CREATE_RFQ_ENDPOINT, rfqData);

    return data;

};

// Get all RFQs
export const getRestaurantRFQs = async () => {

    const { data } = await api.get(`${RFQ_BASE}/restaurant`);

    return data;

};

// Get RFQ details
export const getRFQDetails = async (rfqId) => {

    const { data } = await api.get(`${RFQ_BASE}/${rfqId}`);

    return data;

};
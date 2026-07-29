import api from "./api";


// Create a new quotation request (Restaurant)
export const createQuotation = async (quotationData) => {
    const response = await api.post("/quotations", quotationData);
    return response.data;
};

// Get all quotations for the logged-in supplier
export const getSupplierQuotations = async () => {
    const response = await api.get("/quotations/supplier");
    return response.data;
};

// Get all quotations for the logged-in restaurant
export const getRestaurantQuotations = async () => {
    const response = await api.get("/quotations/restaurant");
    return response.data;
};

// Supplier responds to a quotation
export const respondToQuotation = async (quotationId, quotationData) => {
    const response = await api.put(
        `/quotations/${quotationId}/respond`,
        quotationData
    );
    return response.data;
};

// Restaurant accepts a quotation
export const acceptQuotation = async (quotationId) => {
    const response = await api.put(
        `/quotations/${quotationId}/accept`
    );
    return response.data;
};

// Restaurant rejects a quotation
export const rejectQuotation = async (quotationId) => {
    const response = await api.put(
        `/quotations/${quotationId}/reject`
    );
    return response.data;
};
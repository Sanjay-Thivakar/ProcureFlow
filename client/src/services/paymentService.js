import api from "./api";

const PAYMENT_BASE = "/payments";

// Create Razorpay Payment Order
export const createPaymentOrder = async (orderId) => {

    const { data } = await api.post(
        `${PAYMENT_BASE}/${orderId}/create`
    );

    return data;
};

// Verify Razorpay Payment
export const verifyPayment = async (paymentData) => {

    const { data } = await api.post(
        `${PAYMENT_BASE}/verify`,
        paymentData
    );

    return data;
};
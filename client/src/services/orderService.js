import api from "./api";

const ORDER_BASE = "/orders";

// Get Supplier Orders
export const getSupplierOrders = async () => {

    const { data } = await api.get(`${ORDER_BASE}/supplier`);

    return data;

};

// Accept Order
export const acceptOrder = async (orderId) => {

    const { data } = await api.patch(
        `${ORDER_BASE}/${orderId}/accept`
    );

    return data;

};

// Reject Order
export const rejectOrder = async (orderId) => {

    const { data } = await api.patch(
        `${ORDER_BASE}/${orderId}/reject`
    );

    return data;

};

// Restaurant Orders
export const getRestaurantOrders = async () => {

    const { data } = await api.get("/orders/restaurant");

    return data;

};

export const updateOrderStatus = async (
    orderId,
    orderStatus
) => {

    const { data } = await api.patch(

        `/orders/${orderId}/status`,

        {

            orderStatus,

        }

    );

    return data;

};
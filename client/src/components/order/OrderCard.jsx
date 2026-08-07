import React from "react";
import toast from "react-hot-toast";

import {
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
} from "../../services/orderService";

const OrderCard = ({ order, onSuccess }) => {

    const getStatusStyles = (status) => {

        switch (status) {

            case "pending_supplier_confirmation":
                return "bg-yellow-100 text-yellow-700";

            case "confirmed":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            case "shipped":
                return "bg-blue-100 text-blue-700";

            case "delivered":
                return "bg-purple-100 text-purple-700";

            case "completed":
                return "bg-emerald-100 text-emerald-700";
            
            case "preparing":
                return "bg-blue-100 text-blue-700";

            case "out_for_delivery":
                return "bg-purple-100 text-purple-700";

            case "delivered":
                return "bg-emerald-100 text-emerald-700";

            default:
                return "bg-gray-100 text-gray-700";

        }

    };

    const getStatusLabel = (status) => {

        switch (status) {

            case "pending_supplier_confirmation":
                return "Pending Confirmation";

            case "confirmed":
                return "Confirmed";

            case "rejected":
                return "Rejected";

            case "shipped":
                return "Shipped";

            case "delivered":
                return "Delivered";

            case "completed":
                return "Completed";

            case "preparing":
                return "Preparing";

            case "out_for_delivery":
                return "Out For Delivery";

            case "delivered":
                return "Delivered";

            default:
                return status;

        }

    };

    const handleAccept = async () => {

        try {

            await acceptOrder(order._id);

            toast.success("Order accepted successfully.");

            if (onSuccess) {

                await onSuccess();

            }

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to accept order."
            );

        }

    };

    const handleReject = async () => {

        try {

            await rejectOrder(order._id);

            toast.success("Order rejected successfully.");

            if (onSuccess) {

                await onSuccess();

            }

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to reject order."
            );

        }

    };

    const handleStatusUpdate = async (status) => {

        try {

            await updateOrderStatus(order._id, status);

            toast.success("Order status updated successfully.");

            if (onSuccess) {

                await onSuccess();

            }

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to update order."
            );

        }

    };

    return (

        <div className="bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col">

            {/* Header */}

            <div className="flex justify-between items-start mb-6">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">

                        {order.productName}

                    </h2>

                    <p className="text-sm text-gray-500 mt-1">

                        Restaurant Procurement Order

                    </p>

                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(order.orderStatus)}`}
                >

                    {getStatusLabel(order.orderStatus)}

                </span>

            </div>

            {/* Restaurant */}

            <div className="border-t pt-4">

                <p className="text-xs uppercase tracking-wide text-gray-400">

                    Restaurant

                </p>

                <p className="font-semibold text-gray-800 mt-1">

                    {order.restaurant?.name}

                </p>

            </div>

            {/* Quantity */}

            <div className="border-t pt-4 mt-4">

                <p className="text-xs uppercase tracking-wide text-gray-400">

                    Quantity

                </p>

                <p className="font-semibold text-gray-800 mt-1">

                    {order.quantity} {order.unit}

                </p>

            </div>

            {/* Unit Price */}

            <div className="border-t pt-4 mt-4">

                <p className="text-xs uppercase tracking-wide text-gray-400">

                    Agreed Price

                </p>

                <p className="font-semibold text-gray-800 mt-1">

                    ₹{order.agreedPrice}

                </p>

            </div>

            {/* Total */}

            <div className="border-t pt-4 mt-4">

                <p className="text-xs uppercase tracking-wide text-gray-400">

                    Total Amount

                </p>

                <p className="text-2xl font-bold text-green-600 mt-1">

                    ₹{order.totalAmount}

                </p>

            </div>

            {/* Delivery */}

            <div className="border-t pt-4 mt-4">

                <p className="text-xs uppercase tracking-wide text-gray-400">

                    Estimated Delivery

                </p>

                <p className="font-semibold text-gray-800 mt-1">

                    {order.estimatedDelivery
                        ? new Date(order.estimatedDelivery).toLocaleDateString()
                        : "Not Specified"}

                </p>

            </div>

            {/* Actions */}

            <div className="mt-8">

                {/* Pending */}

                {order.orderStatus === "pending_supplier_confirmation" && (

                    <div className="flex gap-3">

                        <button
                            onClick={handleAccept}
                            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                        >
                            Accept Order
                        </button>

                        <button
                            onClick={handleReject}
                            className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
                        >
                            Reject Order
                        </button>

                    </div>

                )}

                {/* Confirmed */}

                {order.orderStatus === "confirmed" && (

                    <button
                        onClick={() =>
                            handleStatusUpdate("preparing")
                        }
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        Start Preparing
                    </button>

                )}

                {/* Preparing */}

                {order.orderStatus === "preparing" && (

                    <button
                        onClick={() =>
                            handleStatusUpdate("out_for_delivery")
                        }
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
                    >
                        Out For Delivery
                    </button>

                )}

                {/* Out for Delivery */}

                {order.orderStatus === "out_for_delivery" && (

                    <button
                        onClick={() =>
                            handleStatusUpdate("delivered")
                        }
                        className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition"
                    >
                        Mark Delivered
                    </button>

                )}

                {/* Delivered */}

                {order.orderStatus === "delivered" && (

                    <div className="bg-green-100 text-green-700 text-center py-3 rounded-lg font-semibold">

                        ✓ Order Delivered

                    </div>

                )}

            </div>

        </div>

    );

};

export default OrderCard;
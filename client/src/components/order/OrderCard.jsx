import React from "react";
import toast from "react-hot-toast";

import {
    acceptOrder,
    rejectOrder,
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

            {
                order.orderStatus === "pending_supplier_confirmation" && (

                    <div className="mt-8 flex gap-3">

                        <button
                            onClick={handleAccept}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                        >

                            Accept Order

                        </button>

                        <button
                            onClick={handleReject}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                        >

                            Reject Order

                        </button>

                    </div>

                )
            }

        </div>

    );

};

export default OrderCard;
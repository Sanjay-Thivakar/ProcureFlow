import React from "react";

import { useState } from "react";
import toast from "react-hot-toast";

import { createPaymentOrder } from "../../services/paymentService";


const RestaurantOrderCard = ({ order }) => {

    const [paymentLoading, setPaymentLoading] = useState(false);

    const handlePayment = async () => {

        try {

            setPaymentLoading(true);

            const response = await createPaymentOrder(order._id);

            console.log("Payment order created:", response);

            const razorpayOrder = response.razorpayOrder;

            // Load Razorpay Checkout
            const script = document.createElement("script");

            script.src = "https://checkout.razorpay.com/v1/checkout.js";

            script.onload = () => {

                const options = {

                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,

                    amount: razorpayOrder.amount,

                    currency: razorpayOrder.currency,

                    name: "ProcureFlow",

                    description: `Payment for ${order.productName}`,

                    order_id: razorpayOrder.id,

                    handler: async function (paymentResponse) {

                        console.log(
                            "Razorpay payment successful:",
                            paymentResponse
                        );

                    },

                    prefill: {
                        name: order.restaurant?.name || "",
                    },

                    theme: {
                        color: "#4f46e5",
                    },

                };

                const razorpay = new window.Razorpay(options);

                razorpay.open();

            };

            script.onerror = () => {

                toast.error("Failed to load Razorpay Checkout.");

            };

            document.body.appendChild(script);

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to initiate payment."
            );

        } finally {

            setPaymentLoading(false);

        }

    };

    const getStatusStyles = (status) => {

        switch (status) {

            case "pending_supplier_confirmation":
                return "bg-yellow-100 text-yellow-700";

            case "confirmed":
                return "bg-green-100 text-green-700";

            case "preparing":
                return "bg-blue-100 text-blue-700";

            case "out_for_delivery":
                return "bg-purple-100 text-purple-700";

            case "delivered":
                return "bg-emerald-100 text-emerald-700";

            case "cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";

        }

    };

    return (

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">

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
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyles(
                        order.orderStatus
                    )}`}
                >
                    {order.orderStatus.replaceAll("_", " ")}
                </span>

            </div>

            {/* Information Grid */}

            <div className="grid grid-cols-2 gap-x-8 gap-y-5">

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">

                        Supplier

                    </p>

                    <p className="font-medium text-gray-800 mt-1">

                        {order.supplier?.name}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">

                        Quantity

                    </p>

                    <p className="font-medium text-gray-800 mt-1">

                        {order.quantity} {order.unit}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">

                        Agreed Price

                    </p>

                    <p className="font-medium text-gray-800 mt-1">

                        ₹{order.agreedPrice}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">

                        Total Amount

                    </p>

                    <p className="font-semibold text-green-600 mt-1">

                        ₹{order.totalAmount}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">

                        Estimated Delivery

                    </p>

                    <p className="font-medium text-gray-800 mt-1">

                        {new Date(order.estimatedDelivery).toLocaleDateString()}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">

                        Current Status

                    </p>

                    <p className="font-medium capitalize text-gray-800 mt-1">

                        {order.orderStatus.replaceAll("_", " ")}

                    </p>

                </div>

            </div>
            {/*Payment Buttion */}

            {order.orderStatus === "delivered" &&
                order.paymentStatus !== "paid" && (

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">

                    <button
                        onClick={handlePayment}
                        disabled={paymentLoading}
                        className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >

                        {paymentLoading
                            ? "Processing..."
                            : `Pay ₹${order.totalAmount}`}

                    </button>

                </div>

            )}

        </div>

    );

};

export default RestaurantOrderCard;
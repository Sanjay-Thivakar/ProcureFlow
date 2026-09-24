
import React,{ useState } from "react";
import toast from "react-hot-toast";

import { createPaymentOrder, verifyPayment} from "../../services/paymentService";


const RestaurantOrderCard = ({ order,onPaymentSuccess }) => {

    const [paymentLoading, setPaymentLoading] = useState(false);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                return resolve(true);
            }

            const existingScript = document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );

            if (existingScript) {
                existingScript.addEventListener("load", () => resolve(true), { once: true });
                existingScript.addEventListener("error", () => resolve(false), { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {

        if (paymentLoading) return;

        try {

            setPaymentLoading(true);

            // Ensure Razorpay SDK is loaded without duplicate script injection
            if (!window.Razorpay) {
                const loaded = await loadRazorpayScript();
                if (!loaded || !window.Razorpay) {
                    setPaymentLoading(false);
                    toast.error("Failed to load Razorpay Checkout.");
                    return;
                }
            }

            const response = await createPaymentOrder(order._id);

            console.log("Payment order created:", response);

            const razorpayOrder = response.razorpayOrder;

            const options = {

                key: import.meta.env.VITE_RAZORPAY_KEY_ID,

                amount: razorpayOrder.amount,

                currency: razorpayOrder.currency,

                name: "ProcureFlow",

                description: `Payment for ${order.productName}`,

                order_id: razorpayOrder.id,

                handler: async function (paymentResponse) {

                    try {

                        console.log(
                            "Razorpay payment successful:",
                            paymentResponse
                        );

                        const verificationResponse =
                            await verifyPayment(paymentResponse);

                        console.log(
                            "Payment verification response:",
                            verificationResponse
                        );

                        toast.success(
                            "Payment completed successfully!"
                        );

                        // Refresh orders in the parent component
                        if (onPaymentSuccess) {
                            await onPaymentSuccess();
                        }

                    } catch (error) {

                        console.error(
                            "Payment verification error:",
                            error
                        );

                        toast.error(
                            error.response?.data?.message ||
                            "Payment verification failed."
                        );

                    } finally {

                        setPaymentLoading(false);

                    }

                },

                prefill: {
                    name: order.restaurant?.name || "",
                },

                theme: {
                    color: "#4f46e5",
                },

                // User closes Razorpay without completing payment
                ondismiss: function () {

                    setPaymentLoading(false);

                },

            };

            const razorpay = new window.Razorpay(options);

            razorpay.open();

        } catch (error) {

            setPaymentLoading(false);

            toast.error(
                error.response?.data?.message ||
                "Failed to initiate payment."
            );

        }

    };

    

    const getStatusStyles = (status) => {

        switch (status) {

            case "pending_supplier_confirmation":
                return "bg-amber-100 text-amber-700";

            case "confirmed":
                return "bg-blue-100 text-blue-700";

            case "preparing":
                return "bg-purple-100 text-purple-700";

            case "out_for_delivery":
                return "bg-purple-100 text-purple-700";

            case "delivered":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            case "cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-slate-100 text-slate-700";

        }

    };

    return (

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6">

            {/* Header */}

            <div className="flex justify-between items-start mb-6">

                <div>

                    <h2 className="text-2xl font-bold text-slate-800">

                        {order.productName}

                    </h2>

                    <p className="text-sm text-slate-500 mt-1">

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

                    <p className="text-xs uppercase tracking-wide text-slate-400">

                        Supplier

                    </p>

                    <p className="font-semibold text-slate-800 mt-1">

                        {order.supplier?.name}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">

                        Quantity

                    </p>

                    <p className="font-semibold text-slate-800 mt-1">

                        {order.quantity} {order.unit}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">

                        Agreed Price

                    </p>

                    <p className="font-semibold text-slate-800 mt-1">

                        ₹{order.agreedPrice}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">

                        Total Amount

                    </p>

                    <p className="font-semibold text-green-600 mt-1">

                        ₹{order.totalAmount}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">

                        Estimated Delivery

                    </p>

                    <p className="font-semibold text-slate-800 mt-1">

                        {new Date(order.estimatedDelivery).toLocaleDateString()}

                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">

                        Current Status

                    </p>

                    <p className="font-semibold capitalize text-slate-800 mt-1">

                        {order.orderStatus.replaceAll("_", " ")}

                    </p>

                </div>

            </div>
            {/* Payment Section */}

                {order.orderStatus === "delivered" && (

                    <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">

                        {order.paymentStatus === "paid" ? (

                            <div className="flex items-center gap-2 text-green-600 font-semibold">

                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                    ✓
                                </span>

                                Payment Successful

                            </div>

                        ) : (

                            <button
                                onClick={handlePayment}
                                disabled={paymentLoading}
                                className="rounded-xl px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                {paymentLoading
                                    ? "Processing..."
                                    : `Pay ₹${order.totalAmount}`}

                            </button>

                        )}

                    </div>

                )}

            

        </div>

    );

};

export default RestaurantOrderCard;
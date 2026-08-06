import React from "react";

const RestaurantOrderCard = ({ order }) => {

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

        </div>

    );

};

export default RestaurantOrderCard;
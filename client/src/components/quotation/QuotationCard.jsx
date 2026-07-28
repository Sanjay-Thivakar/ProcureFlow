import React from "react";

const QuotationCard = ({ quotation }) => {

    const getStatusStyles = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "quoted":
                return "bg-blue-100 text-blue-700";

            case "accepted":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {quotation.product?.name}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Procurement Quotation
                    </p>
                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyles(
                        quotation.status
                    )}`}
                >
                    {quotation.status}
                </span>

            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Supplier
                    </p>

                    <p className="font-medium text-gray-800 mt-1">
                        {quotation.supplier?.name}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Quantity
                    </p>

                    <p className="font-medium text-gray-800 mt-1">
                        {quotation.quantity}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Required By
                    </p>

                    <p className="font-medium text-gray-800 mt-1">
                        {new Date(
                            quotation.requiredBy
                        ).toLocaleDateString()}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Status
                    </p>

                    <p className="font-medium capitalize text-gray-800 mt-1">
                        {quotation.status}
                    </p>
                </div>

            </div>

            {/* Restaurant Note */}
            {quotation.message && (

                <div className="mt-6">

                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Restaurant Note
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">

                        <p className="text-sm text-gray-700 leading-relaxed">
                            {quotation.message}
                        </p>

                    </div>

                </div>

            )}

            {/* Supplier Response (Future Ready) */}
            {quotation.status !== "pending" && (

                <div className="mt-6 border-t pt-5">

                    {quotation.quotedPrice && (
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">
                                Quoted Price
                            </span>

                            <span className="font-semibold">
                                ₹{quotation.quotedPrice}
                            </span>
                        </div>
                    )}

                    {quotation.discountPercentage && (
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">
                                Discount
                            </span>

                            <span className="font-semibold">
                                {quotation.discountPercentage}%
                            </span>
                        </div>
                    )}

                    {quotation.estimatedDelivery && (
                        <div className="flex justify-between mb-3">
                            <span className="text-gray-500">
                                Estimated Delivery
                            </span>

                            <span className="font-semibold">
                                {quotation.estimatedDelivery}
                            </span>
                        </div>
                    )}

                    {quotation.supplierNote && (
                        <div className="mt-4">

                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                                Supplier Note
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">

                                <p className="text-sm text-gray-700">
                                    {quotation.supplierNote}
                                </p>

                            </div>

                        </div>
                    )}

                </div>

            )}

        </div>
    );
};

export default QuotationCard;
import React from "react";

const SupplierQuotationCard = ({ quotation, onRespond }) => {
    
    const getStatusStyles = (status) => {

        switch (status) {

            case "pending":
                return "bg-yellow-100 text-yellow-700";

            case "quoted":
                return "bg-blue-100 text-blue-700";

            case "awarded":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }

    };

    


    return (

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300 flex flex-col h-full">

            {/* Header */}

            <div className="flex justify-between items-start p-6">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        {quotation.product?.name}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        Quotation Request
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

            {/* Details */}

            <div className="px-6 grid grid-cols-2 gap-y-5 gap-x-8">

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Restaurant
                    </p>

                    <p className="font-medium text-gray-800 mt-1">
                        {quotation.restaurant?.name}
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
                        ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                        })}
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

            <div className="px-6 mt-6">

                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    Restaurant Note
                </p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[72px] flex items-center">

                    <p className="text-sm text-gray-700 leading-relaxed">

                        {quotation.message?.trim()
                            ? quotation.message
                            : (
                                <span className="italic text-gray-400">
                                    No special instructions provided.
                                </span>
                            )
                        }

                    </p>

                </div>

            </div>

            {/* Footer */}

            <div className="mt-6 border-t border-gray-200 bg-gray-50 rounded-b-xl p-5">

                <button
                    onClick={() => onRespond(quotation)}
                    disabled={quotation.status !== "pending"}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                        quotation.status === "pending"
                            ? "bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                    {quotation.status === "pending"
                        ? "Respond to Quotation"
                        : "Already Responded"}
                </button>

            </div>

        </div>

    );

};

export default SupplierQuotationCard;
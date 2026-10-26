import React from "react";

const SupplierQuotationCard = ({ quotation, onRespond }) => {
    
    const getStatusStyles = (status) => {

        switch (status) {

            case "pending":
                return "bg-amber-100 text-amber-700";

            case "quoted":
                return "bg-blue-100 text-blue-700";

            case "awarded":
                return "bg-green-100 text-green-700";

            case "rejected":
                return "bg-red-100 text-red-700";

            case "expired":
                return "bg-orange-100 text-orange-700";

            case "declined":
                return "bg-red-100 text-red-700";

            default:
                return "bg-slate-100 text-slate-700";
        }

    };

    const getActionButtonLabel = (status) => {

        switch (status) {

            case "pending":
                return "Respond to Quotation";

            case "quoted":
                return "Quote Submitted";

            case "awarded":
                return "Quote Awarded";

            case "rejected":
                return "Rejected";

            case "expired":
                return "Expired";

            case "declined":
                return "Declined";

            default:
                return "Unavailable";

        }

    };

    return (

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">

            {/* Header */}

            <div className="flex justify-between items-start p-6">

                <div>

                    <h2 className="text-2xl font-bold text-slate-800">
                        {quotation.product?.name}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        Quotation Request
                    </p>

                </div>

                <div className="flex flex-col items-end gap-1.5">
                    {quotation.priority && (
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                                quotation.priority === "Urgent"
                                    ? "bg-rose-100 text-rose-700 border-rose-200"
                                    : quotation.priority === "High"
                                    ? "bg-amber-100 text-amber-800 border-amber-200"
                                    : "bg-sky-100 text-sky-700 border-sky-200"
                            }`}
                        >
                            {quotation.priority}
                        </span>
                    )}
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyles(
                            quotation.status
                        )}`}
                    >
                        {quotation.status}
                    </span>
                </div>

            </div>

            {/* Priority Reason Alert Banner */}
            {quotation.priorityReason && quotation.priority !== "Low" && (
                <div
                    className={`mx-6 mb-4 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                        quotation.priority === "Urgent"
                            ? "bg-rose-50 text-rose-800 border-rose-200 font-medium"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                >
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-white/70">
                        Priority
                    </span>
                    <span className="line-clamp-2">{quotation.priorityReason}</span>
                </div>
            )}

            {/* Details */}

            <div className="px-6 grid grid-cols-2 gap-y-5 gap-x-8">

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Restaurant
                    </p>

                    <p className="font-semibold text-slate-800 mt-1">
                        {quotation.restaurant?.name}
                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Quantity
                    </p>

                    <p className="font-semibold text-slate-800 mt-1">
                        {quotation.quantity}
                    </p>

                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Required By
                    </p>

                    <p className="font-semibold text-slate-800 mt-1">
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

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Status
                    </p>

                    <p className="font-semibold capitalize text-slate-800 mt-1">
                        {quotation.status}
                    </p>

                </div>

            </div>

            {/* Restaurant Note */}

            <div className="px-6 mt-6">

                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                    Restaurant Note
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[72px] flex items-center">

                    <p className="text-sm text-slate-700 leading-relaxed">

                        {quotation.message?.trim()
                            ? quotation.message
                            : (
                                <span className="italic text-slate-400">
                                    No special instructions provided.
                                </span>
                            )
                        }

                    </p>

                </div>

            </div>

            {/* Footer */}

            <div className="mt-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl p-5">

                <button
                    onClick={() => onRespond(quotation)}
                    disabled={quotation.status !== "pending"}
                    className={`w-full rounded-xl py-2.5 px-4 font-medium transition duration-200 ${
                        quotation.status === "pending"
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                >
                    {getActionButtonLabel(quotation.status)}
                </button>

            </div>

        </div>

    );

};

export default SupplierQuotationCard;
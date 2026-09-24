import React from "react";

import {
    acceptQuotation,
    rejectQuotation,
} from "../../services/quotationService";

import toast from "react-hot-toast";


const QuotationCard = ({ quotation,onSuccess }) => {

    const isExpired =
        quotation.status === "expired" ||
        (quotation.status === "quoted" &&
            quotation.validUntil &&
            new Date(quotation.validUntil) < new Date());

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

            case "declined":
                return "bg-red-100 text-red-700";

            case "expired":
                return "bg-orange-100 text-orange-700";

            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    const handleAccept = async () => {

        try {

            await acceptQuotation(quotation._id);

            toast.success("Quotation accepted successfully.");

            if (onSuccess) {
                await onSuccess();
            }

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to accept quotation."
            );

        }

    };

    const handleReject = async () => {

        try {

            await rejectQuotation(quotation._id);

            toast.success("Quotation rejected successfully.");

            if (onSuccess) {
                await onSuccess();
            }

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to reject quotation."
            );

        }

    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col h-full">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">

                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {quotation.product?.name}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        Procurement Quotation
                    </p>
                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusStyles(
                        isExpired ? "expired" : quotation.status
                    )}`}
                >
                    {isExpired ? "expired" : quotation.status}
                </span>

            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">

                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Supplier
                    </p>

                    <p className="font-semibold text-slate-800 mt-1">
                        {quotation.supplier?.name}
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
                        ).toLocaleDateString()}
                    </p>
                </div>

                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Status
                    </p>

                    <p className="font-semibold capitalize text-slate-800 mt-1">
                        {isExpired ? "expired" : quotation.status}
                    </p>
                </div>

            </div>

            {/* Restaurant Note */}
            {quotation.message && (

                <div className="mt-6">

                    <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                        Restaurant Note
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                        <p className="text-sm text-slate-700 leading-relaxed">
                            {quotation.message}
                        </p>

                    </div>

                </div>

            )}

            {/* Supplier Response (Future Ready) */}
            {quotation.status !== "pending" && (

                <div className="mt-6 border-t border-slate-200 pt-5 flex flex-col flex-1">

                    {quotation.quotedPrice && (
                        <div className="flex justify-between mb-3">
                            <span className="text-slate-500">
                                Quoted Price
                            </span>

                            <span className="font-semibold text-slate-800">
                                ₹{quotation.quotedPrice}
                            </span>
                        </div>
                    )}

                    {quotation.discountPercentage && (
                        <div className="flex justify-between mb-3">
                            <span className="text-slate-500">
                                Discount
                            </span>

                            <span className="font-semibold text-slate-800">
                                {quotation.discountPercentage}%
                            </span>
                        </div>
                    )}

                    {quotation.estimatedDelivery && (
                        <div className="flex justify-between mb-3">
                            <span className="text-slate-500">
                                Estimated Delivery
                            </span>

                            <span className="font-semibold text-slate-800">
                                {new Date(quotation.estimatedDelivery).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    {quotation.supplierNote && (
                        <div className="mt-4">

                            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                                Supplier Note
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                                <p className="text-sm text-slate-700">
                                    {quotation.supplierNote}
                                </p>

                            </div>

                        </div>
                    )}

                    {/* Restaurant Actions */}
                    {quotation.status === "quoted" && !isExpired && (

                        <div className="mt-auto pt-6 flex gap-3">

                            <button
                                onClick={handleAccept}
                                className="flex-1 rounded-xl py-2.5 px-4 font-medium bg-green-600 text-white hover:bg-green-700 transition duration-200"
                            >
                                Award Supplier
                            </button>

                            <button
                                onClick={handleReject}
                                className="flex-1 rounded-xl py-2.5 px-4 font-medium bg-red-600 text-white hover:bg-red-700 transition duration-200"
                            >
                                Reject Quote
                            </button>

                        </div>

                    )}

                </div>

            )}

        </div>
    );
};

export default QuotationCard;
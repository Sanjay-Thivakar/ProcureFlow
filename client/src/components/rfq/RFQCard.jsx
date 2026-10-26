import React from "react";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

const RFQCard = ({ rfq, onViewResponses }) => {
    const responsesReceived = rfq.quotations?.filter(
        (quotation) => quotation.status !== "pending"
    ).length || 0;

    const getStatus = () => {
        if (rfq.status === "completed") {
            return {
                text: "Completed",
                color: "bg-emerald-100 text-emerald-700",
            };
        }

        const hasPending = rfq.quotations?.some((q) => q.status === "pending");
        const hasActiveQuoted = rfq.quotations?.some(
            (q) =>
                q.status === "quoted" &&
                (!q.validUntil || new Date(q.validUntil) >= new Date())
        );

        if (!hasPending && !hasActiveQuoted) {
            return {
                text: "Expired",
                color: "bg-orange-100 text-orange-700",
            };
        }

        if (responsesReceived === (rfq.quotations?.length || 0)) {
            return {
                text: "Ready for Review",
                color: "bg-blue-100 text-blue-700",
            };
        }

        return {
            text: "Waiting for Suppliers",
            color: "bg-amber-100 text-amber-700",
        };
    };

    const status = getStatus();

    const getPriorityBadge = (priority) => {
        switch (priority?.toLowerCase()) {
            case "urgent":
                return "bg-rose-100 text-rose-700 border-rose-200";
            case "high":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "normal":
                return "bg-sky-100 text-sky-700 border-sky-200";
            default:
                return "bg-slate-100 text-slate-600 border-slate-200";
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between">
            <div>
                {/* Header with Priority and Status */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {rfq.productName}
                        </h2>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Procurement Request
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                        {rfq.priority && (
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getPriorityBadge(
                                    rfq.priority
                                )}`}
                            >
                                {rfq.priority}
                            </span>
                        )}
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.color}`}
                        >
                            {status.text}
                        </span>
                    </div>
                </div>

                {/* Priority Reason Alert Banner */}
                {rfq.priorityReason && rfq.priority !== "Low" && (
                    <div className={`mb-4 p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                        rfq.priority === "Urgent"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-2">{rfq.priorityReason}</span>
                    </div>
                )}

                {/* Details */}
                <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                            Quantity
                        </span>
                        <span className="font-semibold text-slate-800">
                            {rfq.quantity} {rfq.unit}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                            Required By
                        </span>
                        <span className="font-semibold text-slate-800">
                            {rfq.requiredBy ? new Date(rfq.requiredBy).toLocaleDateString() : "Flexible"}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                            Suppliers Invited
                        </span>
                        <span className="font-semibold text-slate-800">
                            {rfq.quotations?.length || 0}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                            Responses
                        </span>
                        <span className="font-semibold text-slate-800">
                            {responsesReceived} / {rfq.quotations?.length || 0}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-5">
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{
                                width: `${
                                    rfq.quotations?.length
                                        ? (responsesReceived / rfq.quotations.length) * 100
                                        : 0
                                }%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <button
                onClick={() => onViewResponses(rfq)}
                className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
                View Responses & Rankings &rarr;
            </button>
        </div>
    );
};

export default RFQCard;
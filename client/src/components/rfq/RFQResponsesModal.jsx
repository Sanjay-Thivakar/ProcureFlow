import React, { useState } from "react";
import Modal from "../ui/Modal";
import QuotationCard from "../quotation/QuotationCard";
import QuotationRanking from "../ranking/QuotationRanking";
import { Sparkles, List } from "lucide-react";

const RFQResponsesModal = ({
    isOpen,
    onClose,
    rfq,
    onSuccess,
}) => {
    const [viewMode, setViewMode] = useState("ranked"); // 'ranked' | 'standard'

    if (!rfq) return null;

    const responsesReceived = rfq.quotations?.filter(
        (quotation) => quotation.status !== "pending"
    ).length || 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
        >
            <div className="space-y-8 max-w-4xl mx-auto">
                {/* RFQ Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            {rfq.productName}
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm">
                            Procurement Request Responses
                        </p>
                    </div>

                    {/* View Toggle */}
                    {responsesReceived > 0 && (
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                            <button
                                onClick={() => setViewMode("ranked")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                                    viewMode === "ranked"
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Smart Ranking
                            </button>
                            <button
                                onClick={() => setViewMode("standard")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                                    viewMode === "standard"
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <List className="w-3.5 h-3.5" />
                                Standard List
                            </button>
                        </div>
                    )}
                </div>

                {/* RFQ Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                        <p className="text-slate-400 text-xs uppercase font-medium">Quantity</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                            {rfq.quantity} {rfq.unit}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs uppercase font-medium">Required By</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                            {rfq.requiredBy ? new Date(rfq.requiredBy).toLocaleDateString() : "Flexible"}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs uppercase font-medium">Suppliers Invited</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                            {rfq.quotations?.length || 0}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-400 text-xs uppercase font-medium">Quotes Received</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                            {responsesReceived} / {rfq.quotations?.length || 0}
                        </p>
                    </div>
                </div>

                {/* Quotation Section */}
                {viewMode === "ranked" ? (
                    <QuotationRanking
                        rfqId={rfq._id}
                        onSuccess={onSuccess}
                    />
                ) : (
                    <div className="space-y-6">
                        {rfq.quotations?.map((quotation) => (
                            <QuotationCard
                                key={quotation._id}
                                quotation={quotation}
                                onSuccess={onSuccess}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default RFQResponsesModal;
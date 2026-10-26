import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText, AlertTriangle } from "lucide-react";

import SupplierLayout from "../../components/layout/supplier/SupplierLayout";
import SupplierQuotationCard from "../../components/quotation/SupplierQuotationCard";
import RespondQuotationModal from "../../components/quotation/RespondQuotationModal";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/common/Loader";

import { getSupplierQuotations } from "../../services/quotationService";
import { getPrioritizedRFQs } from "../../services/procurementRankingService";

const SupplierQuotations = () => {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuotation, setSelectedQuotation] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchQuotations = async () => {
        try {
            let quotes = [];
            try {
                const response = await getPrioritizedRFQs();
                quotes = response.data || [];
            } catch (err) {
                const fallbackRes = await getSupplierQuotations();
                quotes = fallbackRes.quotations || [];
            }
            setQuotations(quotes);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Failed to load quotations."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const handleRespond = (quotation) => {
        setSelectedQuotation(quotation);
        setIsModalOpen(true);
    };

    // Sort: Pending quotes with highest priority score first
    const sortedQuotations = [...quotations].sort((a, b) => {
        if (a.priorityScore !== undefined && b.priorityScore !== undefined) {
            if (b.priorityScore !== a.priorityScore) {
                return b.priorityScore - a.priorityScore;
            }
        }
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
    });

    const urgentCount = quotations.filter((q) => q.priority === "Urgent").length;

    return (
        <SupplierLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    Incoming Quotations
                </h1>
                <p className="mt-2 text-slate-500">
                    Review and submit bids for quotation requests received from restaurants, prioritized by deadline urgency.
                </p>
            </div>

            {/* Urgent Alert Banner */}
            {urgentCount > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-sm">
                            Urgent Responses Needed: {urgentCount} incoming request{urgentCount > 1 ? "s" : ""}
                        </span>
                        <p className="text-xs text-rose-700 mt-0.5">
                            These requests have imminent delivery deadlines or have been waiting for your response for over 48 hours.
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : quotations.length === 0 ? (
                <EmptyState
                    title="No quotations yet"
                    description="Incoming quotation requests from restaurants will appear here."
                    icon={FileText}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedQuotations.map((quotation) => (
                        <SupplierQuotationCard
                            key={quotation._id}
                            quotation={quotation}
                            onRespond={handleRespond}
                        />
                    ))}
                </div>
            )}

            {selectedQuotation && (
                <RespondQuotationModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedQuotation(null);
                    }}
                    quotation={selectedQuotation}
                    onSuccess={fetchQuotations}
                />
            )}
        </SupplierLayout>
    );
};

export default SupplierQuotations;
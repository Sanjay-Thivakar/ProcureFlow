import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";

import SupplierLayout from "../../components/layout/supplier/SupplierLayout";
import SupplierQuotationCard from "../../components/quotation/SupplierQuotationCard";
import RespondQuotationModal from "../../components/quotation/RespondQuotationModal";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/common/Loader";

import { getSupplierQuotations } from "../../services/quotationService";

const SupplierQuotations = () => {

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedQuotation, setSelectedQuotation] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchQuotations = async () => {

        try {

            const response = await getSupplierQuotations();

            setQuotations(response.quotations);

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

    const sortedQuotations = [...quotations].sort((a, b) => {

        if (a.status === "pending" && b.status !== "pending") {
            return -1;
        }

        if (a.status !== "pending" && b.status === "pending") {
            return 1;
        }

        return 0;

    });

    return (

        <SupplierLayout>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    Incoming Quotations
                </h1>

                <p className="mt-2 text-slate-500">
                    Review quotation requests received from restaurants.
                </p>
            </div>

            {loading ? (

                <Loader />

            ) : quotations.length === 0 ? (

                <EmptyState
                    title="No quotations yet"
                    description="Incoming quotation requests from restaurants will appear here."
                    icon={FileText}
                />

            ) : (

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                    {sortedQuotations.map((quotation) => (

                        <SupplierQuotationCard
                            key={quotation._id}
                            quotation={quotation}
                            onRespond={handleRespond}
                        />

                    ))}

                </div>

            )}

            <RespondQuotationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                quotation={selectedQuotation}
                onSuccess={fetchQuotations}
            />

        </SupplierLayout>

    );

};

export default SupplierQuotations;
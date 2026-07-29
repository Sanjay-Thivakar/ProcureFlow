import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import SupplierLayout from "../../components/layout/supplier/SupplierLayout";
import SupplierQuotationCard from "../../components/quotation/SupplierQuotationCard";
import RespondQuotationModal from "../../components/quotation/RespondQuotationModal";

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

            <div className="p-8">

                <h1 className="text-4xl font-bold text-gray-900">
                    Incoming Quotations
                </h1>

                <p className="text-gray-500 mt-2">
                    Review quotation requests received from restaurants.
                </p>

                {loading ? (

                    <div className="mt-8 text-gray-500">
                        Loading quotations...
                    </div>

                ) : quotations.length === 0 ? (

                    <div className="mt-8 bg-white rounded-xl border border-gray-200 p-8 text-center">

                        <h2 className="text-xl font-semibold">
                            No quotation requests yet
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Restaurants will appear here once they request quotations for your products.
                        </p>

                    </div>

                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">

                        {sortedQuotations.map((quotation) => (

                            <SupplierQuotationCard
                                key={quotation._id}
                                quotation={quotation}
                                onRespond={handleRespond}
                            />

                        ))}

                    </div>

                )}

            </div>

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
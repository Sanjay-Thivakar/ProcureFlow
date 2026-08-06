import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import RFQDetailsModal from "../../components/rfq/RFQDetailsModal";
import RFQCard from "../../components/rfq/RFQCard";
import RFQResponsesModal from "../../components/rfq/RFQResponsesModal";

import { getRestaurantRFQs } from "../../services/rfqService";
import { getRFQDetails } from "../../services/rfqService";


const MyQuotation = () => {

    const [rfqs, setRFQs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedRFQ, setSelectedRFQ] = useState(null);
    const [isResponsesModalOpen, setIsResponsesModalOpen] = useState(false);

    const [activeFilter, setActiveFilter] = useState("all");

  

    const fetchRFQs = async () => {
        try {

            const response = await getRestaurantRFQs();

            setRFQs(response.rfqs);

            if (selectedRFQ) {

                const updated = response.rfqs.find(
                    rfq => rfq._id === selectedRFQ._id
                );

                if (updated) {

                    setSelectedRFQ(updated);

                }

            }

        } catch (error) {

            toast.error(
                error.response?.data?.message || "Failed to load quotations."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        fetchRFQs();
    }, []);

    const refreshSelectedRFQ = async () => {

        if (!selectedRFQ) return;

        try {

            const response = await getRFQDetails(selectedRFQ._id);

            setSelectedRFQ({
                ...response.rfq,
                quotations: response.quotations,
            });

        } catch (error) {

            console.error(error);

        }

    };

    const handleViewResponses = (rfq) => {

        setSelectedRFQ(rfq);

        setIsResponsesModalOpen(true);

    };

    const handleCloseResponses = () => {

        setSelectedRFQ(null);

        setIsResponsesModalOpen(false);

    };

    const filteredRFQs = rfqs.filter((rfq) => {

        if (activeFilter === "all") {
            return true;
        }

        if (activeFilter === "review") {
            return rfq.status === "open";
        }

        if (activeFilter === "waiting") {
            return (
                rfq.status === "open" &&
                rfq.quotations.filter(
                    quotation => quotation.status !== "pending"
                ).length === 0
            );
        }

        if (activeFilter === "completed") {
            return rfq.status === "completed";
        }

        return true;

    });

    return (
        <RestaurantLayout>

            <div className="p-6">

                <h1 className="text-3xl font-bold mb-6">
                    My RFQs
                </h1>

                <div className="flex flex-wrap gap-3 mt-6 mb-10">

                    <button
                        onClick={() => setActiveFilter("all")}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                            activeFilter === "all"
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                        All ({rfqs.length})
                    </button>

                    <button
                        onClick={() => setActiveFilter("review")}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                            activeFilter === "review"
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                    >
                        Ready for Review (
                        {rfqs.filter(r => r.status === "open").length}
                        )
                    </button>

                    <button
                        onClick={() => setActiveFilter("waiting")}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                            activeFilter === "waiting"
                                ? "bg-yellow-500 text-white"
                                : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        }`}
                    >
                        Waiting (
                        {rfqs.filter(
                            r =>
                                r.status === "open" &&
                                r.quotations.filter(
                                    q => q.status !== "pending"
                                ).length === 0
                        ).length}
                        )
                    </button>

                    <button
                        onClick={() => setActiveFilter("completed")}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium transition ${
                            activeFilter === "completed"
                                ? "bg-green-600 text-white"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                    >
                        Completed (
                        {rfqs.filter(r => r.status === "completed").length}
                        )
                    </button>

                </div>

                {loading ? (

                    <div className="text-center text-gray-500">
                        Loading quotations...
                    </div>

                ) : rfqs.length === 0 ? (

                    <div className="text-center text-gray-500">
                        You haven't created any RFQs yet...
                    </div>

                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {filteredRFQs.map((rfq) => (

                            <RFQCard
                                key={rfq._id}
                                rfq={rfq}
                                onViewResponses={handleViewResponses}
                            />

                        ))}

                    </div>

                )}

            </div>

            {
                selectedRFQ && (

                    <RFQResponsesModal
                        isOpen={isResponsesModalOpen}
                        rfq={selectedRFQ}
                        onClose={handleCloseResponses}
                        onSuccess={fetchRFQs}
                    />

                )
            }

        </RestaurantLayout>
    );
};

export default MyQuotation;
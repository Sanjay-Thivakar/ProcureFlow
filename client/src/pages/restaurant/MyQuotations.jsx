import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import RFQDetailsModal from "../../components/rfq/RFQDetailsModal";

import { getRestaurantRFQs } from "../../services/rfqService";

const MyQuotation = () => {

    const [rfqs, setRFQs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedRFQ, setSelectedRFQ] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const fetchRFQs = async () => {
        try {

            const response = await getRestaurantRFQs();

            setRFQs(response.rfqs);

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

    return (
        <RestaurantLayout>

            <div className="p-6">

                <h1 className="text-3xl font-bold mb-6">
                    My RFQs
                </h1>

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

                        {rfqs.map((rfq) => (

                            <div
                                key={rfq._id}
                                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                            >

                                <h2 className="text-2xl font-bold">
                                    {rfq.productName}
                                </h2>

                                <p className="mt-2 text-gray-600">
                                    Quantity : {rfq.quantity} {rfq.unit}
                                </p>

                                <p className="text-gray-600">
                                    Required By : {new Date(rfq.requiredBy).toLocaleDateString()}
                                </p>

                                <p className="text-gray-600">
                                    Suppliers Invited : {rfq.quotations.length}
                                </p>

                                <p className="text-gray-600">
                                    Responses Received : {
                                        rfq.quotations.filter(
                                            quotation => quotation.status !== "pending"
                                        ).length
                                    } / {rfq.quotations.length}
                                </p>

                                <button

                                    onClick={() => {

                                        setSelectedRFQ(rfq);

                                        setIsModalOpen(true);

                                    }}

                                    className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"

                                >

                                    View Responses

                                </button>
                            </div>

                        ))}

                    </div>

                )}

            </div>

            <RFQDetailsModal

                isOpen={isModalOpen}

                rfq={selectedRFQ}

                onClose={() => {

                    setSelectedRFQ(null);

                    setIsModalOpen(false);

                }}

                onSuccess={fetchRFQs}

            />

        </RestaurantLayout>
    );
};

export default MyQuotation;
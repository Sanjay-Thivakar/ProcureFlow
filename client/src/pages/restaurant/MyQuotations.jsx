import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import QuotationCard from "../../components/quotation/QuotationCard";

import { getRestaurantQuotations } from "../../services/quotationService";

const MyQuotation = () => {

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQuotations = async () => {
        try {

            const response = await getRestaurantQuotations();

            setQuotations(response.quotations);

        } catch (error) {

            toast.error(
                error.response?.data?.message || "Failed to load quotations."
            );

        } finally {

            setLoading(false);

        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    return (
        <RestaurantLayout>

            <div className="p-6">

                <h1 className="text-3xl font-bold mb-6">
                    My Quotations
                </h1>

                {loading ? (

                    <div className="text-center text-gray-500">
                        Loading quotations...
                    </div>

                ) : quotations.length === 0 ? (

                    <div className="text-center text-gray-500">
                        You haven't requested any quotations yet.
                    </div>

                ) : (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {quotations.map((quotation) => (

                            <QuotationCard
                                key={quotation._id}
                                quotation={quotation}
                            />

                        ))}

                    </div>

                )}

            </div>

        </RestaurantLayout>
    );
};

export default MyQuotation;
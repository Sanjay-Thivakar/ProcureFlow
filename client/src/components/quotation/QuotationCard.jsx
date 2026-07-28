import React from "react";

const QuotationCard = ({ quotation }) => {
    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition">

            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {quotation.product?.name}
            </h2>

            <div className="space-y-2 text-sm text-gray-700">

                <p>
                    <span className="font-semibold">Supplier:</span>{" "}
                    {quotation.supplier?.name}
                </p>

                <p>
                    <span className="font-semibold">Quantity:</span>{" "}
                    {quotation.quantity}
                </p>

                <p>
                    <span className="font-semibold">Required By:</span>{" "}
                    {new Date(quotation.requiredBy).toLocaleDateString()}
                </p>

                <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span className="capitalize">
                        {quotation.status}
                    </span>
                </p>

                {quotation.message && (
                    <div>
                        <p className="font-semibold">
                            Restaurant Message
                        </p>

                        <p className="text-gray-600">
                            {quotation.message}
                        </p>
                    </div>
                )}

            </div>

        </div>
    );
};

export default QuotationCard;
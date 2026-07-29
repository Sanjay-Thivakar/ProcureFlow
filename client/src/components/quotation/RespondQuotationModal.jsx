import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { respondToQuotation } from "../../services/quotationService";
import toast from "react-hot-toast";

const RespondQuotationModal = ({
    isOpen,
    onClose,
    onSuccess,
    quotation,
}) => {

    const [formData, setFormData] = useState({
        quotedPrice: "",
        discountPercentage: "",
        estimatedDelivery: "",
        supplierNote: "",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {

        if (isOpen) {

            setFormData({
                quotedPrice: "",
                discountPercentage: "",
                estimatedDelivery: "",
                supplierNote: "",
            });

        }

    }, [isOpen]);

    const handleChange = (e) => {

        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));

    };

    const handleSubmit = async () => {

        if (!formData.quotedPrice) {

            toast.error("Quoted price is required.");

            return;
        }

        try {

            setLoading(true);

            await respondToQuotation(
                quotation._id,
                formData
            );

            // Refresh the quotations list
            if (onSuccess) {
                await onSuccess();
            }

            toast.success("Quotation submitted successfully.");

            // Reset form
            setFormData({
                quotedPrice: "",
                discountPercentage: "",
                estimatedDelivery: "",
                supplierNote: "",
            });

            onClose();

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to submit quotation."
            );

        } finally {

            setLoading(false);

        }

    };


    if (!isOpen || !quotation) return null;

    return (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}

                <div className="flex justify-between items-center border-b border-gray-200 px-6 py-5">

                    <div>

                        <h2 className="text-2xl font-bold text-gray-900">
                            Respond to Quotation
                        </h2>

                        <p className="text-gray-500 mt-1">
                            Submit your quotation for this request.
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Product Summary */}

                <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">

                    <div className="grid grid-cols-2 gap-6">

                        <div>

                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                Product
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {quotation.product?.name}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                Restaurant
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {quotation.restaurant?.name}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                Quantity
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">
                                {quotation.quantity}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                Listed Price
                            </p>

                            <p className="font-semibold text-green-600 mt-1">
                                ₹ {quotation.listedPrice} / {quotation.unit}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                Required By
                            </p>

                            <p className="font-semibold text-gray-900 mt-1">

                                {new Date(
                                    quotation.requiredBy
                                ).toLocaleDateString("en-IN")}

                            </p>

                        </div>

                    </div>

                </div>

                {/* Form */}

                <div className="p-6 space-y-6">

                    <div className="grid grid-cols-2 gap-6">

                        <div>

                            <label className="block text-sm font-medium mb-2">
                                Quoted Price *
                            </label>

                            <input
                                type="number"
                                name="quotedPrice"
                                value={formData.quotedPrice}
                                onChange={handleChange}
                                placeholder="Enter quoted price"
                                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />

                        </div>

                        <div>

                            <label className="block text-sm font-medium mb-2">
                                Discount (%)
                            </label>

                            <input
                                type="number"
                                name="discountPercentage"
                                value={formData.discountPercentage}
                                onChange={handleChange}
                                placeholder="Optional"
                                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />

                        </div>

                    </div>

                    <div>

                        <label className="block text-sm font-medium mb-2">
                            Estimated Delivery
                        </label>

                        <input
                            type="date"
                            name="estimatedDelivery"
                            value={formData.estimatedDelivery}
                            onChange={handleChange}
                            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />

                    </div>

                    <div>

                        <label className="block text-sm font-medium mb-2">
                            Supplier Note
                        </label>

                        <textarea
                            rows={4}
                            name="supplierNote"
                            value={formData.supplierNote}
                            onChange={handleChange}
                            placeholder="Add delivery details or additional information..."
                            className="w-full border rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                        />

                    </div>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-4 border-t border-gray-200 px-6 py-5 bg-gray-50">

                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading
                            ? "Submitting..."
                            : "Submit Response"}
                    </button>

                </div>

            </div>

        </div>

    );

};

export default RespondQuotationModal;
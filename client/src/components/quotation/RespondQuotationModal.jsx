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

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}

                <div className="flex justify-between items-center border-b border-slate-200 px-6 py-5">

                    <div>

                        <h2 className="text-2xl font-bold text-slate-800">
                            Respond to Quotation
                        </h2>

                        <p className="text-slate-500 mt-1">
                            Submit your quotation for this request.
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Product Summary */}

                <div className="px-6 py-5 bg-slate-50 border-b border-slate-200">

                    <div className="grid grid-cols-2 gap-6">

                        <div>

                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Product
                            </p>

                            <p className="font-semibold text-slate-800 mt-1">
                                {quotation.product?.name}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Restaurant
                            </p>

                            <p className="font-semibold text-slate-800 mt-1">
                                {quotation.restaurant?.name}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Quantity
                            </p>

                            <p className="font-semibold text-slate-800 mt-1">
                                {quotation.quantity}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Listed Price
                            </p>

                            <p className="font-semibold text-green-600 mt-1">
                                ₹ {quotation.listedPrice} / {quotation.unit}
                            </p>

                        </div>

                        <div>

                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                Required By
                            </p>

                            <p className="font-semibold text-slate-800 mt-1">

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

                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Quoted Price *
                            </label>

                            <input
                                type="number"
                                name="quotedPrice"
                                value={formData.quotedPrice}
                                onChange={handleChange}
                                placeholder="Enter quoted price"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                            />

                        </div>

                        <div>

                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Discount (%)
                            </label>

                            <input
                                type="number"
                                name="discountPercentage"
                                value={formData.discountPercentage}
                                onChange={handleChange}
                                placeholder="Optional"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                            />

                        </div>

                    </div>

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Estimated Delivery
                        </label>

                        <input
                            type="date"
                            name="estimatedDelivery"
                            value={formData.estimatedDelivery}
                            onChange={handleChange}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        />

                    </div>

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Supplier Note
                        </label>

                        <textarea
                            rows={4}
                            name="supplierNote"
                            value={formData.supplierNote}
                            onChange={handleChange}
                            placeholder="Add delivery details or additional information..."
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 resize-none outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        />

                    </div>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5 bg-slate-50">

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100 transition duration-200"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
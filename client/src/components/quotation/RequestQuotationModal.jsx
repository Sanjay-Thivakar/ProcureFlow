import { useEffect, useState } from "react";

const RequestQuotationModal = ({
    isOpen,
    onClose,
    onSubmit,
    product,
}) => {

    const [formData, setFormData] = useState({
        quantity: "",
        requiredBy: "",
        message: "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                quantity: "",
                requiredBy: "",
                message: "",
            });
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        onSubmit({
            productId: product._id,
            quantity: Number(formData.quantity),
            requiredBy: formData.requiredBy,
            message: formData.message,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-xl w-full max-w-lg p-6">

                <h2 className="text-2xl font-bold mb-6">
                    Request Quotation
                </h2>

                <p className="text-gray-500 mb-5">
                    {product.name}
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <div>
                        <label className="block mb-2 font-medium">
                            Quantity
                        </label>

                        <input
                            type="number"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            required
                            min="1"
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">
                            Required By
                        </label>

                        <input
                            type="date"
                            name="requiredBy"
                            value={formData.requiredBy}
                            onChange={handleChange}
                            required
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">
                            Message
                        </label>

                        <textarea
                            name="message"
                            rows="4"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Additional requirements..."
                            className="w-full border rounded-lg p-3 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-lg border"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
                        >
                            Request Quote
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default RequestQuotationModal;
import { useState } from "react";

const CreateRFQModal = ({
    isOpen,
    onClose,
    onSubmit,
    selectedCount,
}) => {

    const [quantity, setQuantity] = useState("");
    const [requiredBy, setRequiredBy] = useState("");
    const [message, setMessage] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e) => {

        e.preventDefault();

        onSubmit({
            quantity: Number(quantity),
            requiredBy,
            message,
        });

    };

    return (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-xl">

                <h2 className="text-2xl font-bold mb-2">

                    Create RFQ

                </h2>

                <p className="text-gray-500 mb-6">

                    You have selected <strong>{selectedCount}</strong> supplier listings.

                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <div>

                        <label className="block text-sm font-medium mb-2">

                            Quantity

                        </label>

                        <input
                            type="number"
                            min="1"
                            required
                            value={quantity}
                            onChange={(e) =>
                                setQuantity(e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-3"
                        />

                    </div>

                    <div>

                        <label className="block text-sm font-medium mb-2">

                            Required By

                        </label>

                        <input
                            type="date"
                            required
                            value={requiredBy}
                            onChange={(e) =>
                                setRequiredBy(e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-3"
                        />

                    </div>

                    <div>

                        <label className="block text-sm font-medium mb-2">

                            Message (Optional)

                        </label>

                        <textarea
                            rows="4"
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-3"
                            placeholder="Additional requirements..."
                        />

                    </div>

                    <div className="flex justify-end gap-3 pt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-lg border"
                        >

                            Cancel

                        </button>

                        <button
                            type="submit"
                            className="px-5 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700"
                        >

                            Create RFQ

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};

export default CreateRFQModal;
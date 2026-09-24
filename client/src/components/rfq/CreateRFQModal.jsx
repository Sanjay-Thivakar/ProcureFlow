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

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">

                <h2 className="text-2xl font-bold text-slate-800 mb-2">

                    Create RFQ

                </h2>

                <p className="text-slate-500 mb-6">

                    You have selected <strong className="text-slate-800">{selectedCount}</strong> supplier listings.

                </p>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">

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
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        />

                    </div>

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">

                            Required By

                        </label>

                        <input
                            type="date"
                            required
                            value={requiredBy}
                            onChange={(e) =>
                                setRequiredBy(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                        />

                    </div>

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">

                            Message (Optional)

                        </label>

                        <textarea
                            rows="4"
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition"
                            placeholder="Additional requirements..."
                        />

                    </div>

                    <div className="flex justify-end gap-3 pt-4">

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100 transition duration-200"
                        >

                            Cancel

                        </button>

                        <button
                            type="submit"
                            className="rounded-xl bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 transition duration-200"
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
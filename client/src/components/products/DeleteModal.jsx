import { Trash2 } from "lucide-react";

const DeleteModal = ({
    isOpen,
    product,
    onClose,
    onConfirm,
}) => {

    if (!isOpen) return null;

    return (

        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        >

            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
            >

                {/* Header */}

                <div className="flex items-center gap-3 border-b border-slate-200 p-6">

                    <div className="rounded-full bg-red-100 p-3">
                        <Trash2
                            size={22}
                            className="text-red-600"
                        />
                    </div>

                    <div>

                        <h2 className="text-xl font-bold text-slate-800">
                            Delete Product
                        </h2>

                        <p className="text-sm text-slate-500">
                            This action cannot be undone.
                        </p>

                    </div>

                </div>

                {/* Body */}

                <div className="p-6">

                    <p className="text-slate-700">
                        Are you sure you want to delete
                    </p>

                    <p className="mt-2 rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-800">
                        {product?.name}
                    </p>

                </div>

                {/* Footer */}

                <div className="flex justify-end gap-3 border-t border-slate-200 p-6">

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-300 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-100"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onConfirm}
                        className="rounded-xl bg-red-600 px-5 py-2.5 font-medium text-white hover:bg-red-700"
                    >
                        Delete
                    </button>

                </div>

            </div>

        </div>

    );

};

export default DeleteModal;
import ProductForm from "./ProductForm";

const ProductModal = ({
    isOpen,
    onClose,
    onSubmit,
    product = null,
}) => {

    if (!isOpen) return null;

    return (

        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        >

            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
            >

                {/* Header */}

                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                    <h2 className="text-2xl font-bold text-slate-800">

                        {product
                            ? "Edit Product"
                            : "Add Product"}

                    </h2>

                    <button
                        onClick={onClose}
                        className="text-2xl text-slate-500 hover:text-slate-800"
                    >
                        ×
                    </button>

                </div>

                {/* Form */}

                <div className="p-6">

                    <ProductForm
                        initialData={product}
                        onSubmit={onSubmit}
                        onCancel={onClose}
                    />

                </div>

            </div>

        </div>

    );
};

export default ProductModal;
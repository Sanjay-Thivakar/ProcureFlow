import { Pencil, Trash2, Package } from "lucide-react";

const ProductCard = ({
    product,
    onEdit,
    onDelete,
}) => {

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">

            {/* Header */}

            <div className="flex justify-between items-start p-5">

                <div>

                    <h2 className="text-xl font-bold text-slate-800">
                        {product.name}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        {product.category}
                    </p>

                </div>

                <div className="p-3 rounded-xl bg-indigo-100">
                    <Package
                        size={22}
                        className="text-indigo-600"
                    />
                </div>

            </div>

            {/* Details */}

            <div className="px-5 space-y-3">

                <div className="flex justify-between">

                    <span className="text-slate-500">
                        Unit
                    </span>

                    <span className="font-semibold">
                        {product.unit}
                    </span>

                </div>

                <div className="flex justify-between">

                    <span className="text-slate-500">
                        Price
                    </span>

                    <span className="font-semibold text-green-600">
                        ₹ {product.price}
                    </span>

                </div>

                <div className="flex justify-between">

                    <span className="text-slate-500">
                        Stock
                    </span>

                    <span
                        className={`font-semibold ${
                            product.stock > 0
                                ? "text-green-600"
                                : "text-red-600"
                        }`}
                    >
                        {product.stock}
                    </span>

                </div>

            </div>

            {/* Footer */}

            <div className="flex gap-3 p-5 mt-4 border-t border-slate-100">

                <button
                    onClick={() => onEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-white hover:bg-amber-600 transition"
                >
                    <Pencil size={16} />
                    Edit
                </button>

                <button
                    onClick={() => onDelete(product)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2 text-white hover:bg-red-700 transition"
                >
                    <Trash2 size={16} />
                    Delete
                </button>

            </div>

        </div>
    );
};

export default ProductCard;
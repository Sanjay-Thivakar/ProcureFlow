import { Pencil, Trash2, Package } from "lucide-react";

const ProductCard = ({
    product,
    onEdit,
    onDelete,
}) => {

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300">

            {/* Header */}
            <div className="flex justify-between items-start p-6">

                <div>

                    <h2 className="text-2xl font-bold text-slate-800">
                        {product.name}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        {product.category}
                    </p>

                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <Package
                        size={22}
                        className="text-indigo-600"
                    />
                </div>

            </div>

            {/* Details */}
            <div className="px-6 space-y-5">

                {/* Unit */}
                <div className="flex justify-between items-center">

                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                            Unit
                        </p>

                        <p className="font-semibold text-slate-800 mt-1">
                            {product.unit}
                        </p>
                    </div>

                </div>

                {/* Price */}
                <div className="flex justify-between items-center">

                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                            Price
                        </p>
                    </div>

                    <div className="text-right">

                        <p className="font-bold text-xl text-green-600">
                            ₹ {product.price}
                        </p>

                        <p className="text-xs text-slate-400">
                            per {product.unit}
                        </p>

                    </div>

                </div>

                {/* Stock */}
                <div className="flex justify-between items-center">

                    <p className="text-xs uppercase tracking-wide text-slate-400">
                        Available Stock
                    </p>

                    <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            product.stock > 0
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {product.stock} {product.unit}
                    </span>

                </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 mt-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">

                <button
                    onClick={() => onEdit(product)}
                    className="
                        flex-1
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        bg-amber-500
                        py-2.5
                        font-semibold
                        text-white
                        hover:bg-amber-600
                        hover:scale-[1.02]
                        transition-all
                        duration-200
                    "
                >
                    <Pencil size={16} />
                    Edit
                </button>

                <button
                    onClick={() => onDelete(product)}
                    className="
                        flex-1
                        flex
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        bg-red-600
                        py-2.5
                        font-semibold
                        text-white
                        hover:bg-red-700
                        hover:scale-[1.02]
                        transition-all
                        duration-200
                    "
                >
                    <Trash2 size={16} />
                    Delete
                </button>

            </div>

        </div>
    );
};

export default ProductCard;
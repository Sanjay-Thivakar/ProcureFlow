const BrowseProductCard = ({ product,selected,disabled,onToggleSelect }) => {
    return (
        <div
            className={`rounded-xl shadow-sm p-6 transition-all duration-300 ${
                disabled
                    ? "bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed"
                    : selected
                    ? "border-2 border-green-600 bg-green-50 shadow-lg"
                    : "border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1"
            }`}
        >

            {/* Header */}
            <div className="flex justify-between items-start mb-6">

                <div>

                    <h2 className="text-2xl font-bold text-gray-900">
                        {product.name}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                        {product.category}
                    </p>

                </div>

                <div className="flex items-center gap-2">

                    {
                        selected && (

                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">

                                ✓

                            </span>

                        )
                    }

                    <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">

                        {product.stock} {product.unit}

                    </span>

                </div>

            </div>

            {
                disabled && (

                    <div className="mt-4 mb-4 rounded-lg bg-yellow-100 text-yellow-700 text-sm px-4 py-2">

                        Finish your current RFQ before selecting another product.

                    </div>  

                )
            }

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">

                <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Supplier
                    </p>

                    <p className="font-semibold text-gray-900 mt-1">
                        {product.supplier?.name}
                    </p>
                </div>

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Price
                    </p>

                    <p className="font-semibold text-green-600 text-lg mt-1">
                        ₹{product.price}
                    </p>

                    <p className="text-xs text-gray-500">
                        per {product.unit}
                    </p>

                </div>

            </div>

            <button
                onClick={() => onToggleSelect(product)}
                disabled={disabled}
                className={`mt-8 w-full font-semibold py-3 rounded-lg transition-colors duration-200 ${
                     disabled

                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"

                    : selected

                        ? "bg-red-100 text-red-600 hover:bg-red-200"

                    : "bg-green-600 hover:bg-green-700 text-white"

                }`}
            >
                {
                    disabled

                        ? "Finish Current RFQ"

                    : selected

                        ? "✓ Supplier Selected"

                    : "Select Supplier"
                }

            </button>

        </div>
    );
};

export default BrowseProductCard;
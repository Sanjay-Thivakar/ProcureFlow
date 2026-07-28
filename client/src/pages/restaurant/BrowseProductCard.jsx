const BrowseProductCard = ({ product, onRequestQuote }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6">

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

                <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {product.stock} {product.unit}
                </span>

            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">

                <div>

                    <p className="text-xs uppercase tracking-wide text-gray-400">
                        Supplier
                    </p>

                    <p className="font-medium text-gray-800 mt-1">
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

            {/* Button */}
            <button
                onClick={() => onRequestQuote(product)}
                className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
            >
                Request Quote →
            </button>

        </div>
    );
};

export default BrowseProductCard;
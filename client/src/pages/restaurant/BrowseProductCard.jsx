const BrowseProductCard = ({ product, onRequestQuote }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">

            <div className="flex justify-between items-start">

                <div>

                    <h3 className="text-xl font-semibold text-gray-800">
                        {product.name}
                    </h3>

                    <p className="text-gray-500 mt-1">
                        {product.category}
                    </p>

                </div>

                <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                    {product.stock} {product.unit}
                </span>

            </div>

            <div className="mt-5 space-y-2">

                <p className="text-gray-700">
                    <span className="font-semibold">
                        Supplier:
                    </span>{" "}
                    {product.supplier?.name}
                </p>

                <p className="text-gray-700">
                    <span className="font-semibold">
                        Price:
                    </span>{" "}
                    ₹{product.price} / {product.unit}
                </p>

            </div>

            <button
                onClick={() => onRequestQuote(product)}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition"
            >
                Request Quote
            </button>

        </div>
    );
};

export default BrowseProductCard;
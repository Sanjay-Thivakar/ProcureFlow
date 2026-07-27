const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20">

            <h2 className="text-2xl font-bold text-slate-700">
                No Products Found
            </h2>

            <p className="mt-3 text-slate-500">
                Click "Add Product" to create your first product.
            </p>

        </div>
    );
};

export default EmptyState;
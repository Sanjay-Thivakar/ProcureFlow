import { Plus, Search } from "lucide-react";

const ProductHeader = ({
    searchTerm,
    onSearch,
    onAddProduct,
}) => {
    return (
        <div className="mb-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                {/* Left */}

                <div>

                    <h1 className="text-3xl font-bold text-slate-800">
                        Products
                    </h1>

                    <p className="mt-2 text-slate-500">
                        Manage your restaurant inventory.
                    </p>

                </div>

                {/* Right */}

                <button
                    onClick={onAddProduct}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-medium text-white transition hover:bg-indigo-700"
                >
                    <Plus size={18} />

                    Add Product
                </button>

            </div>

            {/* Search */}

            <div className="relative mt-6">

                <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 outline-none transition focus:border-indigo-500"
                />

            </div>

        </div>
    );
};

export default ProductHeader;
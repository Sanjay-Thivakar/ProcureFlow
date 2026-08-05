import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import BrowseProductCard from "./BrowseProductCard";
import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import CreateRFQModal from "../../components/rfq/CreateRFQModal";

import { getProducts } from "../../services/productService";
import { createRFQ } from "../../services/rfqService";


const BrowseProducts = () => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isRFQModalOpen, setIsRFQModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [sortBy, setSortBy] = useState("default");

    const activeProductName =
    selectedProducts.length > 0
        ? selectedProducts[0].name
        : null;

    const categories = [
        "All",
        ...new Set(products.map((product) => product.category))
    ];

    const filteredProducts = products
        .filter((product) => {

            const matchesSearch =
                product.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" ||
                product.category === selectedCategory;

            return matchesSearch && matchesCategory;

        })
        .sort((a, b) => {

            switch (sortBy) {

                case "priceLowHigh":
                    return a.price - b.price;

                case "priceHighLow":
                    return b.price - a.price;

                case "nameAZ":
                    return a.name.localeCompare(b.name);

                case "stockHighLow":
                    return b.stock - a.stock;

                default:
                    return 0;
            }

        });

    useEffect(() => {
        fetchProducts();
    }, []);


    const fetchProducts = async () => {
        try {

            setLoading(true);

            const response = await getProducts();

            setProducts(response.products);

        } catch (error) {

            console.error(error);

            setError(
                error.response?.data?.message ||
                "Failed to load products."
            );

        } finally {

            setLoading(false);

        }
    };

    const handleCreateRFQ = async (rfqData) => {

        try {
            

            await createRFQ({

                ...rfqData,

                productListings: selectedProducts.map(
                    product => product._id
                ),

            });

            toast.success("RFQ created successfully!");

            setSelectedProducts([]);

            setIsRFQModalOpen(false);

            fetchProducts();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.message ||
                "Failed to create RFQ."
            );

        }

    };

   const toggleProductSelection = (product) => {

        setSelectedProducts((previousProducts) => {

            const alreadySelected = previousProducts.find(
                (selectedProduct) => selectedProduct._id === product._id
            );

            if (alreadySelected) {

                return previousProducts.filter(
                    (selectedProduct) => selectedProduct._id !== product._id
                );

            }

            return [...previousProducts, product];

        });

    };

    return (
        <RestaurantLayout>

            <div className="p-8">

                <div className="mb-8">

                    <h1 className="text-3xl font-bold">

                        Browse Products

                    </h1>

                    <p className="text-gray-500 mt-2">

                        Compare supplier listings and create a Request for Quotation.

                    </p>

                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">

                    <div className="flex flex-col lg:flex-row gap-4">

                        {/* Search */}

                        <input
                            type="text"
                            placeholder="🔍 Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        {/* Category */}

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >

                            {categories.map(category => (

                                <option
                                    key={category}
                                    value={category}
                                >
                                    {category}
                                </option>

                            ))}

                        </select>

                        {/* Sort */}

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >

                            <option value="default">
                                Sort By
                            </option>

                            <option value="priceLowHigh">
                                Price ↑
                            </option>

                            <option value="priceHighLow">
                                Price ↓
                            </option>

                            <option value="nameAZ">
                                Name A-Z
                            </option>

                            <option value="stockHighLow">
                                Stock
                            </option>

                        </select>

                        {/* Reset */}

                        <button

                            onClick={() => {

                                setSearchTerm("");

                                setSelectedCategory("All");

                                setSortBy("default");

                            }}

                            className="px-5 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"

                        >

                            Reset

                        </button>

                    </div>

                </div>

                <div className="flex justify-between items-center bg-white border rounded-xl p-5 mb-8">

                    <div>

                        <h2 className="text-lg font-semibold">

                            Supplier Listings

                        </h2>

                        <p className="text-gray-500">

                            {filteredProducts.length} Available

                        </p>

                    </div>

                    <div className="text-right">

                        <h2 className="text-lg font-semibold text-green-700">

                            Selected Suppliers

                        </h2>

                        <p className="text-gray-500">

                            
                            {selectedProducts.length}

                        </p>

                    </div>

                </div>

                {
                    products.length === 0 ? (

                        <div className="text-center text-gray-500 mt-10">

                            No supplier products are available at the moment.

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {
                                filteredProducts.map((product) => (

                                    <BrowseProductCard
                                        key={product._id}
                                        product={product}
                                         selected={
                                            selectedProducts.some(
                                                (selectedProduct) =>
                                                    selectedProduct._id === product._id
                                            )
                                        }

                                         disabled={
                                            activeProductName &&
                                            product.name !== activeProductName
                                        }
                                        onToggleSelect={toggleProductSelection}
                                    />

                                ))
                            }

                        </div>

                    )
                }

                {
                    selectedProducts.length > 0 && (

                        <div className="fixed bottom-8 right-8">

                            <button
                                onClick={() => setIsRFQModalOpen(true)}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl shadow-xl font-semibold"
                            >

                                Create RFQ ({selectedProducts.length} Suppliers)

                            </button>

                        </div>

                    )
                }

            </div>

            <CreateRFQModal
                isOpen={isRFQModalOpen}
                onClose={() => setIsRFQModalOpen(false)}
                onSubmit={handleCreateRFQ}
                selectedCount={selectedProducts.length}
            />
        </RestaurantLayout>

    );

};

export default BrowseProducts;
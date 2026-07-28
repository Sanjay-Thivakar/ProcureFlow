import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import BrowseProductCard from "./BrowseProductCard";
import RequestQuotationModal from "../../components/quotation/RequestQuotationModal";
import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";

import { getProducts } from "../../services/productService";
import { createQuotation } from "../../services/quotationService";

const BrowseProducts = () => {

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [selectedProduct, setSelectedProduct] = useState(null);

    const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

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

    const handleRequestQuotation = (product) => {

        setSelectedProduct(product);

        setIsQuotationModalOpen(true);

    };

    const handleCloseQuotationModal = () => {

        setSelectedProduct(null);

        setIsQuotationModalOpen(false);

    };

    const handleSubmitQuotation = async (quotationData) => {

        try {

            await createQuotation(quotationData);

            toast.success("Quotation requested successfully!");

            handleCloseQuotationModal();

        } catch (error) {

            console.error(error);

            toast.error(
                error.response?.data?.message ||
                "Failed to request quotation."
            );

        }

    };

    if (loading) {

        return (
            <div className="p-8">
                Loading products...
            </div>
        );

    }

    if (error) {

        return (
            <div className="p-8 text-red-600">
                {error}
            </div>
        );

    }

    return (
        <RestaurantLayout>

            <div className="p-8">

                <div className="mb-8">

                    <h1 className="text-3xl font-bold">

                        Browse Products

                    </h1>

                    <p className="text-gray-500 mt-2">

                        Browse supplier products and request quotations.

                    </p>

                </div>

                {
                    products.length === 0 ? (

                        <div className="text-center text-gray-500 mt-10">

                            No products available.

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                            {
                                products.map((product) => (

                                    <BrowseProductCard
                                        key={product._id}
                                        product={product}
                                        onRequestQuote={handleRequestQuotation}
                                    />

                                ))
                            }

                        </div>

                    )
                }

                {
                    selectedProduct && (

                        <RequestQuotationModal
                            isOpen={isQuotationModalOpen}
                            product={selectedProduct}
                            onClose={handleCloseQuotationModal}
                            onSubmit={handleSubmitQuotation}
                        />

                    )
                }

            </div>
        </RestaurantLayout>

    );

};

export default BrowseProducts;
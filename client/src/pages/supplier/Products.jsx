import { useEffect, useState } from "react";

import ProductHeader from "../../components/products/ProductHeader";
import ProductCard from "../../components/products/ProductCard";
import EmptyState from "../../components/products/EmptyState";
import DashboardLayout from "../../components/layout/supplier/SupplierLayout";
import ProductModal from "../../components/products/ProductModal";
import DeleteModal from "../../components/products/DeleteModal";


import {
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../../services/productService";


const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");

    

   
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    //This constants are for the product form part
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        const filtered = products.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredProducts(filtered);
    }, [products, searchTerm]);

    const fetchProducts = async () => {
        try {
            const response = await getMyProducts();

            setProducts(response.products);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = () => {
        console.log("Add Product clicked");
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteProduct = (product) => {
        setSelectedProduct(product);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setSelectedProduct(null);
        setIsDeleteModalOpen(false);
    };

    
    const handleCloseModal = () => {
        setSelectedProduct(null);
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                Loading Products...
            </div>
        );
    }

    const handleSubmit = async (formData) => {

        try {

            if (selectedProduct) {

                await updateProduct(
                    selectedProduct._id,
                    formData
                );

            } else {

                await createProduct(formData);

            }

            await fetchProducts();

            handleCloseModal();

        } catch (error) {

            console.error(error);

        }

    };

    const handleConfirmDelete = async () => {

        try {

            await deleteProduct(selectedProduct._id);

            await fetchProducts();

            handleCloseDeleteModal();

        } catch (error) {

            console.error(error);

        }

    };

    return (
        <DashboardLayout>
            <div className="p-8">

                <ProductHeader
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                    onAddProduct={handleAddProduct}
                />

                {filteredProducts.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onEdit={handleEditProduct}
                                onDelete={handleDeleteProduct}
                            />
                        ))}

                    </div>
                )}

                {/* Product Modal */}
                
                <ProductModal
                    
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmit}
                    product={selectedProduct}
                />

                
                {/* Delete Modal */}

                <DeleteModal
                    isOpen={isDeleteModalOpen}
                    product={selectedProduct}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleConfirmDelete}
                />

            </div>
        </DashboardLayout>
    );
};

export default Products;
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import SupplierLayout from "../../components/layout/supplier/SupplierLayout";
import OrderCard from "../../components/order/OrderCard";

import { getSupplierOrders } from "../../services/orderService";

const SupplierOrders = () => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {

        try {

            const response = await getSupplierOrders();

            setOrders(response.orders);

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to load orders."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        fetchOrders();

    }, []);

    return (

        <SupplierLayout>

            <div className="p-6">

                <h1 className="text-3xl font-bold mb-6">

                    My Orders

                </h1>

                {

                    loading ? (

                        <div className="text-center text-gray-500">

                            Loading orders...

                        </div>

                    ) : orders.length === 0 ? (

                        <div className="text-center text-gray-500">

                            No orders available.

                        </div>

                    ) : (

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {

                                orders.map((order) => (

                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        onSuccess={fetchOrders}
                                    />

                                ))

                            }

                        </div>

                    )

                }

            </div>

        </SupplierLayout>

    );

};

export default SupplierOrders;
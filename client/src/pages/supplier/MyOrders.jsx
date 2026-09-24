import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList } from "lucide-react";

import SupplierLayout from "../../components/layout/supplier/SupplierLayout";
import OrderCard from "../../components/order/OrderCard";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/common/Loader";

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

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    My Orders
                </h1>
                <p className="mt-2 text-slate-500">
                    Manage and fulfill orders placed by restaurants.
                </p>
            </div>

            {
                loading ? (

                    <Loader />

                ) : orders.length === 0 ? (

                    <EmptyState
                        title="No orders yet"
                        description="Orders placed by restaurants will appear here."
                        icon={ClipboardList}
                    />

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

        </SupplierLayout>

    );

};

export default SupplierOrders;
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, AlertTriangle } from "lucide-react";

import SupplierLayout from "../../components/layout/supplier/SupplierLayout";
import OrderCard from "../../components/order/OrderCard";
import EmptyState from "../../components/ui/EmptyState";
import Loader from "../../components/common/Loader";

import { getSupplierOrders } from "../../services/orderService";
import { getPrioritizedOrders } from "../../services/procurementRankingService";

const SupplierOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            let orderList = [];
            try {
                const response = await getPrioritizedOrders();
                orderList = response.data || [];
            } catch (err) {
                const fallbackRes = await getSupplierOrders();
                orderList = fallbackRes.orders || [];
            }
            setOrders(orderList);
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

    const urgentOrdersCount = orders.filter((o) => o.priority === "Urgent").length;

    return (
        <SupplierLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    My Orders
                </h1>
                <p className="mt-2 text-slate-500">
                    Manage and fulfill orders placed by restaurants, prioritized by confirmation urgency and delivery deadlines.
                </p>
            </div>

            {/* Urgent Orders Alert Banner */}
            {urgentOrdersCount > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                        <span className="font-bold text-sm">
                            Action Needed: {urgentOrdersCount} urgent order{urgentOrdersCount > 1 ? "s" : ""}
                        </span>
                        <p className="text-xs text-rose-700 mt-0.5">
                            Orders awaiting immediate supplier confirmation or overdue for delivery are highlighted.
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : orders.length === 0 ? (
                <EmptyState
                    title="No orders yet"
                    description="Orders placed by restaurants will appear here."
                    icon={ClipboardList}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <OrderCard
                            key={order._id}
                            order={order}
                            onSuccess={fetchOrders}
                        />
                    ))}
                </div>
            )}
        </SupplierLayout>
    );
};

export default SupplierOrders;
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PackageCheck, AlertTriangle } from "lucide-react";

import { getRestaurantOrders } from "../../services/orderService";
import { getPrioritizedOrders } from "../../services/procurementRankingService";
import RestaurantOrderCard from "../../components/order/RestaurantOrderCard";
import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/ui/EmptyState";

const RestaurantOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            let orderList = [];
            try {
                const response = await getPrioritizedOrders();
                orderList = response.data || [];
            } catch (err) {
                const fallbackRes = await getRestaurantOrders();
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
        <RestaurantLayout>
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">
                        My Orders
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Track and manage your orders placed with suppliers, automatically prioritized by delivery deadlines.
                    </p>
                </div>

                {/* Urgent Orders Alert Banner */}
                {urgentOrdersCount > 0 && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800">
                        <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                        <div>
                            <span className="font-bold text-sm">
                                Attention Required: {urgentOrdersCount} urgent or overdue order{urgentOrdersCount > 1 ? "s" : ""}
                            </span>
                            <p className="text-xs text-rose-700 mt-0.5">
                                Orders with overdue deliveries or stalled confirmations have been prioritized to the top of your list.
                            </p>
                        </div>
                    </div>
                )}

                {loading ? (
                    <Loader />
                ) : orders.length === 0 ? (
                    <EmptyState
                        title="No orders yet"
                        description="Orders you place with suppliers will appear here."
                        icon={PackageCheck}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {orders.map((order) => (
                            <RestaurantOrderCard
                                key={order._id}
                                order={order}
                                onPaymentSuccess={fetchOrders}
                            />
                        ))}
                    </div>
                )}
            </div>
        </RestaurantLayout>
    );
};

export default RestaurantOrders;
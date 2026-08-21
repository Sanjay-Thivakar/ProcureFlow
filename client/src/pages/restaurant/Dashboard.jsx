import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Package, Clock3, CheckCircle, FileText } from "lucide-react";

import DashboardLayout from "../../components/layout/restaurant/RestaurantLayout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";
import Loader from "../../components/common/Loader";

import { getRestaurantRFQs } from "../../services/rfqService";
import { getRestaurantOrders } from "../../services/orderService";

const getRelativeTime = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
};

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState([]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [rfqResponse, orderResponse] = await Promise.all([
                    getRestaurantRFQs(),
                    getRestaurantOrders()
                ]);

                const rfqs = rfqResponse.rfqs || [];
                const orders = orderResponse.orders || [];

                // 1. Active RFQs: open status
                const activeRFQsCount = rfqs.filter(r => r.status === "open").length;

                // 2. Pending Quotations: count of pending quotes under open RFQs
                const pendingQuotesCount = rfqs
                    .filter(r => r.status === "open")
                    .reduce((acc, r) => acc + r.quotations.filter(q => q.status === "pending").length, 0);

                // 3. Active Orders: orderStatus in progress
                const activeOrdersCount = orders.filter(o =>
                    ["pending_supplier_confirmation", "confirmed", "preparing", "out_for_delivery"].includes(o.orderStatus)
                ).length;

                // 4. Orders Awaiting Payment: orderStatus is delivered and paymentStatus is pending
                const awaitingPaymentCount = orders.filter(o =>
                    o.orderStatus === "delivered" && o.paymentStatus === "pending"
                ).length;

                setStats([
                    {
                        title: "Active RFQs",
                        value: activeRFQsCount,
                        subtitle: "Open procurement requests",
                        icon: FileText,
                        color: "indigo",
                    },
                    {
                        title: "Pending Quotes",
                        value: pendingQuotesCount,
                        subtitle: "Awaiting supplier responses",
                        icon: Clock3,
                        color: "amber",
                    },
                    {
                        title: "Active Orders",
                        value: activeOrdersCount,
                        subtitle: "Orders currently in progress",
                        icon: Package,
                        color: "emerald",
                    },
                    {
                        title: "Awaiting Payment",
                        value: awaitingPaymentCount,
                        subtitle: "Delivered, unpaid orders",
                        icon: CheckCircle,
                        color: "rose",
                    },
                ]);

                // Generate activities
                const mappedActivities = [];

                rfqs.forEach(rfq => {
                    // RFQ created
                    mappedActivities.push({
                        title: `Created RFQ for ${rfq.productName} (${rfq.quantity} ${rfq.unit})`,
                        time: getRelativeTime(rfq.createdAt),
                        rawTime: new Date(rfq.createdAt),
                        status: "info"
                    });

                    // Bids received or awarded
                    rfq.quotations.forEach(q => {
                        if (q.status === "quoted") {
                            mappedActivities.push({
                                title: `Quotation received for ${rfq.productName} from ${q.supplier?.name || "Supplier"}`,
                                time: getRelativeTime(q.updatedAt),
                                rawTime: new Date(q.updatedAt),
                                status: "pending"
                            });
                        } else if (q.status === "awarded") {
                            mappedActivities.push({
                                title: `Quotation awarded to ${q.supplier?.name || "Supplier"} for ${rfq.productName}`,
                                time: getRelativeTime(q.updatedAt),
                                rawTime: new Date(q.updatedAt),
                                status: "success"
                            });
                        }
                    });
                });

                orders.forEach(order => {
                    // Order placed
                    mappedActivities.push({
                        title: `Order placed with ${order.supplier?.name || "Supplier"} for ${order.productName}`,
                        time: getRelativeTime(order.createdAt),
                        rawTime: new Date(order.createdAt),
                        status: "info"
                    });

                    // Order updates
                    if (order.orderStatus === "confirmed") {
                        mappedActivities.push({
                            title: `Order for ${order.productName} confirmed by ${order.supplier?.name || "Supplier"}`,
                            time: getRelativeTime(order.updatedAt),
                            rawTime: new Date(order.updatedAt),
                            status: "success"
                        });
                    } else if (order.orderStatus === "preparing") {
                        mappedActivities.push({
                            title: `Order for ${order.productName} is being prepared`,
                            time: getRelativeTime(order.updatedAt),
                            rawTime: new Date(order.updatedAt),
                            status: "info"
                        });
                    } else if (order.orderStatus === "out_for_delivery") {
                        mappedActivities.push({
                            title: `Order for ${order.productName} is out for delivery`,
                            time: getRelativeTime(order.updatedAt),
                            rawTime: new Date(order.updatedAt),
                            status: "warning"
                        });
                    } else if (order.orderStatus === "delivered") {
                        mappedActivities.push({
                            title: `Order for ${order.productName} has been delivered`,
                            time: getRelativeTime(order.updatedAt),
                            rawTime: new Date(order.updatedAt),
                            status: "success"
                        });
                    }

                    if (order.paymentStatus === "paid") {
                        mappedActivities.push({
                            title: `Payment verified for ${order.productName} (₹${order.totalAmount})`,
                            time: getRelativeTime(order.updatedAt),
                            rawTime: new Date(order.updatedAt),
                            status: "success"
                        });
                    }
                });

                // Sort by rawTime desc, take top 5
                const sorted = mappedActivities
                    .filter(act => act.rawTime && !isNaN(act.rawTime.getTime()))
                    .sort((a, b) => b.rawTime - a.rawTime)
                    .slice(0, 5);

                setActivities(sorted);
            } catch (err) {
                console.error(err);
                const errMsg = err.response?.data?.message || "Failed to load dashboard data.";
                setError(errMsg);
                toast.error(errMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">
                    Dashboard
                </h2>
                <p className="mt-2 text-slate-500">
                    Here's an overview of your restaurant's procurement activity.
                </p>
            </div>

            {loading ? (
                <Loader />
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
                    {error}
                </div>
            ) : (
                <>
                    <DashboardStats stats={stats} />
                    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">
                        <QuickActions />
                        <div className="xl:col-span-2">
                            <RecentActivity activities={activities} />
                        </div>
                    </div>
                </>
            )}
        </DashboardLayout>
    );
};

export default Dashboard;
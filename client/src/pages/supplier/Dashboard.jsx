import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Package, Clock3, ClipboardList, Wallet } from "lucide-react";

import DashboardLayout from "../../components/layout/supplier/SupplierLayout";
import DashboardStats from "../../components/dashboard/DashboardStats";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";
import Loader from "../../components/common/Loader";

import { getMyProducts } from "../../services/productService";
import { getSupplierQuotations } from "../../services/quotationService";
import { getSupplierOrders } from "../../services/orderService";

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
                const [productResponse, quotationResponse, orderResponse] = await Promise.all([
                    getMyProducts(),
                    getSupplierQuotations(),
                    getSupplierOrders()
                ]);

                const products = productResponse.products || [];
                const quotations = quotationResponse.quotations || [];
                const orders = orderResponse.orders || [];

                // 1. Products Listed: count of supplier's own products
                const productsCount = products.length;

                // 2. Pending Quotations: count of pending quotes
                const pendingQuotesCount = quotations.filter(q => q.status === "pending").length;

                // 3. Active Orders: orderStatus is confirmed, preparing, or out_for_delivery
                const activeOrdersCount = orders.filter(o =>
                    ["confirmed", "preparing", "out_for_delivery"].includes(o.orderStatus)
                ).length;

                // 4. Total Revenue: sum of totalAmount for o.paymentStatus === "paid"
                const totalRevenue = orders
                    .filter(o => o.paymentStatus === "paid")
                    .reduce((acc, o) => acc + o.totalAmount, 0);

                setStats([
                    {
                        title: "Products Listed",
                        value: productsCount,
                        subtitle: "Catalog items available",
                        icon: Package,
                        color: "indigo",
                    },
                    {
                        title: "Pending RFQs",
                        value: pendingQuotesCount,
                        subtitle: "Quotation requests awaiting response",
                        icon: Clock3,
                        color: "amber",
                    },
                    {
                        title: "Active Orders",
                        value: activeOrdersCount,
                        subtitle: "Orders currently in progress",
                        icon: ClipboardList,
                        color: "emerald",
                    },
                    {
                        title: "Total Revenue",
                        value: `₹${totalRevenue.toLocaleString()}`,
                        subtitle: "Earnings from paid orders",
                        icon: Wallet,
                        color: "rose",
                    },
                ]);

                // Generate activities
                const mappedActivities = [];

                quotations.forEach(q => {
                    if (q.status === "pending") {
                        mappedActivities.push({
                            title: `Received RFQ request for ${q.productName} from ${q.restaurant?.name || "Restaurant"}`,
                            time: getRelativeTime(q.createdAt),
                            rawTime: new Date(q.createdAt),
                            status: "pending"
                        });
                    } else if (q.status === "quoted") {
                        mappedActivities.push({
                            title: `Submitted quote for ${q.productName} to ${q.restaurant?.name || "Restaurant"}`,
                            time: getRelativeTime(q.updatedAt),
                            rawTime: new Date(q.updatedAt),
                            status: "info"
                        });
                    } else if (q.status === "awarded") {
                        mappedActivities.push({
                            title: `Quote for ${q.productName} awarded by ${q.restaurant?.name || "Restaurant"}`,
                            time: getRelativeTime(q.updatedAt),
                            rawTime: new Date(q.updatedAt),
                            status: "success"
                        });
                    }
                });

                orders.forEach(order => {
                    // Order received
                    mappedActivities.push({
                        title: `New order received for ${order.productName} from ${order.restaurant?.name || "Restaurant"}`,
                        time: getRelativeTime(order.createdAt),
                        rawTime: new Date(order.createdAt),
                        status: "info"
                    });

                    // Order updates
                    if (order.orderStatus === "confirmed") {
                        mappedActivities.push({
                            title: `Confirmed order for ${order.productName} from ${order.restaurant?.name || "Restaurant"}`,
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
                            title: `Order for ${order.productName} marked as delivered`,
                            time: getRelativeTime(order.updatedAt),
                            rawTime: new Date(order.updatedAt),
                            status: "success"
                        });
                    }

                    if (order.paymentStatus === "paid") {
                        mappedActivities.push({
                            title: `Payment of ₹${order.totalAmount} received for ${order.productName}`,
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
                    Here's an overview of your supplier's procurement activity.
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
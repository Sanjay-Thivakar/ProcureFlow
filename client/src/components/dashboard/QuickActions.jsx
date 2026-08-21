import { Plus, FilePlus2, Package, FileText, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import QuickActionCard from "./QuickActionCard";

const QuickActions = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isSupplier = user?.role === "supplier";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-slate-800">
                Quick Actions
            </h3>

            <div className="space-y-4">
                {isSupplier ? (
                    <>
                        <QuickActionCard
                            title="Add Product"
                            description="Create a new catalog item"
                            icon={Plus}
                            onClick={() => navigate("/products")}
                        />
                        <QuickActionCard
                            title="Incoming RFQs"
                            description="Review quotation requests"
                            icon={FileText}
                            onClick={() => navigate("/supplier/quotations")}
                        />
                        <QuickActionCard
                            title="Manage Orders"
                            description="View and update orders"
                            icon={ClipboardList}
                            onClick={() => navigate("/supplier/orders")}
                        />
                    </>
                ) : (
                    <>
                        <QuickActionCard
                            title="Request Quotation"
                            description="Browse products and send RFQ"
                            icon={FilePlus2}
                            onClick={() => navigate("/restaurant/products")}
                        />
                        <QuickActionCard
                            title="My RFQs"
                            description="View sent RFQs and bids"
                            icon={FileText}
                            onClick={() => navigate("/restaurant/rfqs")}
                        />
                        <QuickActionCard
                            title="View Orders"
                            description="Track delivery and pay orders"
                            icon={ClipboardList}
                            onClick={() => navigate("/restaurant/orders")}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default QuickActions;
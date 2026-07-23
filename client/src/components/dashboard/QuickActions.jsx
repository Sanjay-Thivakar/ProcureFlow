import { Plus, FilePlus2, Package } from "lucide-react";
import QuickActionCard from "./QuickActionCard";

const QuickActions = () => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-semibold text-slate-800">
                Quick Actions
            </h3>

            <div className="space-y-4">
                <QuickActionCard
                    title="Add Product"
                    description="Create a new procurement item"
                    icon={Plus}
                    onClick={() => console.log("Add Product")}
                />

                <QuickActionCard
                    title="Request Quotation"
                    description="Send a quotation request"
                    icon={FilePlus2}
                    onClick={() => console.log("Request Quotation")}
                />

                <QuickActionCard
                    title="View Products"
                    description="Manage your inventory"
                    icon={Package}
                    onClick={() => console.log("View Products")}
                />
            </div>
        </div>
    );
};

export default QuickActions;
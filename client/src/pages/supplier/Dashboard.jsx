import DashboardLayout from "../../components/layout/supplier/SupplierLayout";

import DashboardStats from "../../components/dashboard/DashboardStats";
import QuickActions from "../../components/dashboard/QuickActions";
import RecentActivity from "../../components/dashboard/RecentActivity";



const Dashboard = () => {
    return (
        <DashboardLayout>

            {/* Welcome Section */}

            <div className="mb-8">

                <h2 className="text-3xl font-bold text-slate-800">
                    Dashboard
                </h2>

                <p className="mt-2 text-slate-500">
                    Here's an overview of your restaurant's procurement activity.
                </p>

            </div>

            <DashboardStats />

            <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-3">

                <QuickActions />

                    <div className="xl:col-span-2">
                        <RecentActivity />
                    </div>


                

            </div>

        </DashboardLayout>
    );
};

export default Dashboard;
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    PackageSearch,
    FileText,
    User,
} from "lucide-react";

const RestaurantSidebar = () => {

    const navItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Browse Products",
            path: "/restaurant/products",
            icon: PackageSearch,
        },
        {
            name: "My Quotations",
            path: "/restaurant/quotations",
            icon: FileText,
        },
        {
            name: "Profile",
            path: "/profile",
            icon: User,
        },
    ];

    return (
        <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">

            <div className="border-b border-slate-200 p-6">
                <h1 className="text-2xl font-bold">
                    ProcureFlow
                </h1>
            </div>

            <nav className="flex-1 space-y-2 p-4">

                {navItems.map((item) => {

                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    isActive
                                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`
                            }
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </NavLink>
                    );

                })}

            </nav>

        </aside>
    );
};

export default RestaurantSidebar;
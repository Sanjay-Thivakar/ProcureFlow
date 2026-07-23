import {
    Package,
    Clock3,
    CheckCircle,
    Users,
} from "lucide-react";

import StatCard from "./StatCard";

const DashboardStats = () => {
    const stats = [
        {
            title: "Products",
            value: 24,
            subtitle: "12 added this month",
            icon: Package,
            color: "indigo",
        },
        {
            title: "Pending Quotes",
            value: 6,
            subtitle: "Awaiting supplier response",
            icon: Clock3,
            color: "amber",
        },
        {
            title: "Accepted",
            value: 18,
            subtitle: "This month",
            icon: CheckCircle,
            color: "emerald",
        },
        {
            title: "Suppliers",
            value: 42,
            subtitle: "Registered suppliers",
            icon: Users,
            color: "rose",
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <StatCard
                    key={stat.title}
                    title={stat.title}
                    value={stat.value}
                    subtitle={stat.subtitle}
                    icon={stat.icon}
                    color={stat.color}
                />
            ))}
        </div>
    );
};

export default DashboardStats;
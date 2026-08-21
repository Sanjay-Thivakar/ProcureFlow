import {
    Package,
    Clock3,
    CheckCircle,
    Users,
} from "lucide-react";

import StatCard from "./StatCard";

const DashboardStats = ({ stats = [] }) => {
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
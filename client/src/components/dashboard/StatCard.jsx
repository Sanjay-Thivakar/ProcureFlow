const colorClasses = {
    indigo: "bg-indigo-100 text-indigo-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    rose: "bg-rose-100 text-rose-600",
};

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "indigo",
}) => {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <h2 className="mt-3 text-4xl font-bold text-slate-800">
                        {value}
                    </h2>

                    <p className="mt-3 text-sm text-slate-500">
                        {subtitle}
                    </p>

                </div>

                <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${colorClasses[color]}`}
                >
                    <Icon size={28} />
                </div>

            </div>

        </div>
    );
};

export default StatCard;
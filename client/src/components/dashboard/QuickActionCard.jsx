const QuickActionCard = ({
    title,
    description,
    icon: Icon,
    onClick,
}) => {
    return (
        <button
            onClick={onClick}
            className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
        >
            <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon size={22} />
                </div>

                <div className="text-left">
                    <h3 className="font-semibold text-slate-800">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-500">
                        {description}
                    </p>
                </div>

            </div>

            <span className="text-slate-400 transition group-hover:translate-x-1">
                →
            </span>
        </button>
    );
};

export default QuickActionCard;
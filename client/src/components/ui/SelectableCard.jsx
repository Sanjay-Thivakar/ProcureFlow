const SelectableCard = ({
    title,
    description,
    icon,
    selected = false,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`
                w-full
                rounded-2xl
                border
                p-4
                text-left
                transition-all
                duration-200
                hover:border-indigo-400
                hover:shadow-md
                ${
                    selected
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-300 bg-white"
                }
            `}
        >
            <div className="flex items-center gap-4">

                <div className="text-indigo-600">
                    {icon}
                </div>

                <div>

                    <h3 className="font-semibold text-slate-900">
                        {title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>

                </div>

            </div>
        </button>
    );
};

export default SelectableCard;
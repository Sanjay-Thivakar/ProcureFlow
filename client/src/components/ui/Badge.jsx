const Badge = ({
    children,
    variant = "default",
}) => {

    const variants = {
        default:
            "bg-slate-100 text-slate-700",

        success:
            "bg-green-100 text-green-700",

        warning:
            "bg-yellow-100 text-yellow-700",

        danger:
            "bg-red-100 text-red-700",

        info:
            "bg-blue-100 text-blue-700",
    };

    return (
        <span
            className={`
                inline-flex
                items-center
                rounded-full
                px-3
                py-1
                text-sm
                font-medium
                ${variants[variant]}
            `}
        >
            {children}
        </span>
    );
};

export default Badge;
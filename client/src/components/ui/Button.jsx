const Button = ({
    children,
    type = "button",
    variant = "primary",
    size = "md",
    loading = false,
    loadingText = "Please wait...",
    disabled = false,
    className = "",
    ...rest
}) => {

    const variants = {
        primary:
            "bg-indigo-600 text-white hover:bg-indigo-700",

        secondary:
            "bg-slate-200 text-slate-800 hover:bg-slate-300",

        success:
            "bg-green-600 text-white hover:bg-green-700",

        danger:
            "bg-red-600 text-white hover:bg-red-700",

        outline:
            "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100",

        ghost:
            "bg-transparent text-slate-700 hover:bg-slate-100",
    };

    const sizes = {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-base",
        lg: "h-12 px-6 text-lg",
    };

    return (
        <button
            type={type}
            disabled={disabled || loading}
            className={`
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                font-medium
                transition-all
                duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
                focus:outline-none
                focus:ring-2
                focus:ring-indigo-500
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            {...rest}
        >
            {loading && (
                <span
                    className="
                        h-4
                        w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-current
                        border-r-transparent
                    "
                />
            )}

            <span>
                {loading ? loadingText : children}
            </span>
        </button>
    );
};

export default Button;
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = ({
    label,
    error,
    type = "text",
    className = "",
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordField = type === "password";

    const inputType = isPasswordField
        ? showPassword
            ? "text"
            : "password"
        : type;

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    type={inputType}
                    className={`
                        w-full rounded-lg border border-slate-300
                        px-4 py-3
                        text-slate-900
                        placeholder:text-slate-400
                        focus:border-indigo-500
                        focus:outline-none
                        focus:ring-2
                        focus:ring-indigo-200
                        transition
                        ${isPasswordField ? "pr-12" : ""}
                        ${className}
                    `}
                    {...props}
                />

                {isPasswordField && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-indigo-600"
                    >
                        {showPassword ? (
                            <EyeOff size={20} />
                        ) : (
                            <Eye size={20} />
                        )}
                    </button>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
};

export default Input;
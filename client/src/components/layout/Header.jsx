import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";


import { useAuth } from "../../context/AuthContext";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const hour = new Date().getHours();

    const greeting =
        hour < 12
            ? "Good Morning"
            : hour < 18
            ? "Good Afternoon"
            : "Good Evening";

    const initials = user?.name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">

            {/* Left Section */}

            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    {greeting},
                    <span className="text-indigo-600">
                        {" "}{user?.name} 👋
                    </span>
                </h1>

                <p className="mt-1 text-sm text-slate-500 capitalize">
                    {user?.role} Account
                </p>
            </div>

            {/* Right Section */}

            <div className="flex items-center gap-6">

                <button
                    className="rounded-full p-2 transition hover:bg-slate-100"
                >
                    <Bell size={20} />
                </button>

                <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                        {initials}
                    </div>

                    <div className="hidden md:block">
                        <p className="font-medium text-slate-800">
                            {user?.name}
                        </p>

                        <p className="text-xs capitalize text-slate-500">
                            {user?.role}
                        </p>
                    </div>

                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                >
                    <LogOut size={18} />
                    Logout
                </button>

            </div>

        </header>
    );
};

export default Header;
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">

            <div>
                <h1 className="text-2xl font-bold text-slate-800">
                    Welcome Back,
                    <span className="text-indigo-600">
                        {" "}{user?.name}
                    </span>
                </h1>

                <p className="mt-1 text-sm text-slate-500 capitalize">
                    {user?.role} Account
                </p>
            </div>

            <Button
                variant="outline"
                onClick={handleLogout}
            >
                <LogOut size={18} />
                Logout
            </Button>

        </header>
    );
};

export default Header;
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

import RestaurantDashboard from "../pages/restaurant/Dashboard";
import SupplierDashboard from "../pages/supplier/Dashboard";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Products from "../pages/supplier/Products";

const AppRoutes = () => {
    const { user } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            {user?.role === "supplier" ? (
                                <SupplierDashboard />
                            ) : (
                                <RestaurantDashboard />
                            )}
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/products"
                    element={
                        <ProtectedRoute>
                            <Products />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;


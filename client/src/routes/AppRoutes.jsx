import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";

import RestaurantDashboard from "../pages/restaurant/Dashboard";
import SupplierDashboard from "../pages/supplier/Dashboard";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import Products from "../pages/supplier/Products";
import BrowseProducts from '../pages/restaurant/BrowseProducts'

import MyQuotation from "../pages/restaurant/MyQuotations";
import SupplierQuotations from "../pages/supplier/SupplierQuotations";

import SupplierOrders from "../pages/supplier/MyOrders";
import RestaurantOrders from "../pages/restaurant/MyOrders";

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

                <Route
                    path="/restaurant/products"
                    element={
                    <ProtectedRoute>
                        <BrowseProducts />
                    </ProtectedRoute>
                    }
                />

                <Route
                    path="/restaurant/rfqs"
                    element={
                        <ProtectedRoute allowedRoles={["restaurant"]}>
                            <MyQuotation />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/supplier/quotations"
                    element={
                        <ProtectedRoute allowedRoles={["supplier"]}>
                            <SupplierQuotations />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/supplier/orders"
                    element={<SupplierOrders />}
                />

                <Route
                    path="/restaurant/orders"
                    element={<RestaurantOrders />}
                />


            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;


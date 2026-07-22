import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";
import { storage } from "../utils/storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(storage.getUser());
    const [token, setToken] = useState(storage.getToken());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const data = await authService.login(credentials);

        storage.setToken(data.token);
        storage.setUser(data.user);

        setToken(data.token);
        setUser(data.user);

        return data;
    };

    const register = async (userData) => {
        return await authService.register(userData);
    };

    const logout = () => {
        storage.clear();
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
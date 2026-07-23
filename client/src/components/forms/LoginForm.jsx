import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Input from "../common/Input";
import Button from "../common/Button";

import { useAuth } from "../../context/AuthContext";

const LoginForm = () => {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            setLoading(true);

            await login(formData);

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

            alert(error.response?.data?.message || "Login Failed");

        } finally {

            setLoading(false);

        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-5"
        >
            <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
            />

            <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
            />

            <Button
                type="submit"
                loading={loading}
                loadingText="Signing In..."
                className="mt-2 w-full"
            >
                Sign In
            </Button>

        </form>
    );
};

export default LoginForm;
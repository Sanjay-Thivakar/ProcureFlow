import { useState } from "react";
import { Store, UtensilsCrossed } from "lucide-react";

import Input from "../ui/Input";
import Button from "../ui/Button";
import SelectableCard from "../ui/SelectableCard";

//used for rrouting from frontend to backend , and also to provide the authorization contex register/login
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";




const RegisterForm = () => {

    const navigate = useNavigate();
    const { register } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "restaurant",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRoleChange = (role) => {
        setFormData((prev) => ({
            ...prev,
            role,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });

            alert("Registration successful! Please sign in.");

            navigate("/login");
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Registration failed."
            );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Personal Information */}

            <Input
                label="Full Name"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
            />

            <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
            />

            <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
            />

            <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
            />

            {/* Role Selection */}

            <div className="space-y-3">

                <h3 className="text-sm font-medium text-slate-700">
                    Choose Account Type
                </h3>

                <SelectableCard
                    title="Restaurant"
                    description="Request quotations from suppliers."
                    icon={<UtensilsCrossed size={24} />}
                    selected={formData.role === "restaurant"}
                    onClick={() => handleRoleChange("restaurant")}
                />

                <SelectableCard
                    title="Supplier"
                    description="Respond to quotation requests."
                    icon={<Store size={24} />}
                    selected={formData.role === "supplier"}
                    onClick={() => handleRoleChange("supplier")}
                />

            </div>

            <Button
                type="submit"
                className="w-full"
            >
                Create Account
            </Button>

        </form>
    );
};

export default RegisterForm;
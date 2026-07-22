import { Link } from "react-router-dom";

import AuthLayout from "../../components/layout/AuthLayout";
import RegisterForm from "../../components/forms/RegisterForm";

const Register = () => {
    return (
        <AuthLayout
            title="Create Your Account"
            subtitle="Join ProcureFlow and streamline your procurement process."
        >
            <RegisterForm />

            <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                    Sign In
                </Link>
            </p>
        </AuthLayout>
    );
};

export default Register;
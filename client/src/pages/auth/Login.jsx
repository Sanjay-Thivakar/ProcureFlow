import { Link } from "react-router-dom";

import AuthLayout from "../../components/layout/AuthLayout";
import LoginForm from "../../components/forms/LoginForm";

const Login = () => {
    return (
        <AuthLayout
            title="Welcome Back "
            subtitle="Sign in to continue"
            footer={
                <>
                    New To ProcureFlow?{" "}
                    <Link
                        to="/register"
                        className="font-medium text-indigo-600 hover:text-indigo-700"
                    >
                        Create one
                    </Link>
                </>
            }
        >
            <LoginForm />
        </AuthLayout>
    );
};

export default Login;
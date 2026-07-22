import Card from "../ui/Card";
import BrandLogo from "../common/BrandLogo";

const AuthLayout = ({
    title,
    subtitle,
    children,
    footer,
}) => {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">

            <Card className="w-full max-w-lg">

                <BrandLogo />

                <div className="mt-10 mb-8 text-center">

                    <h2 className="text-2xl font-semibold text-slate-900">
                        {title}
                    </h2>

                    <p className="mt-1 text-sm font-medium  text-slate-500">
                        {subtitle}
                    </p>

                </div>

                {children}

                {footer && (
                    <div className="mt-8 text-center text-sm text-slate-600">
                        {footer}
                    </div>
                )}

            </Card>

        </div>
    );
};

export default AuthLayout;
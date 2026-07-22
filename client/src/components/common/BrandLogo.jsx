import { Package } from "lucide-react";

const BrandLogo = () => {
    return (
        <div className="flex flex-col items-center">

            <div className="mb-4 rounded-2xl bg-indigo-600 p-3 text-white shadow-sm">
                <Package size={28} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                ProcureFlow
            </h1>

            <p className="mt-2 text-sm font-medium text-slate-600">
                Restaurant Procurement Simplified
            </p>

        </div>
    );
};

export default BrandLogo;
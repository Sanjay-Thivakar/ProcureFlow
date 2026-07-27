import SupplierSidebar from "./SupplierSidebar";
import SupplierHeader from "./SupplierHeader";

const SupplierLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-slate-100">

            <SupplierSidebar />

            <div className="flex flex-1 flex-col">

                <SupplierHeader />

                <main className="flex-1 p-8">
                    {children}
                </main>

            </div>

        </div>
    );
};

export default SupplierLayout;
import RestaurantSidebar from "./RestaurantSidebar";
import RestaurantHeader from "./RestaurantHeader";

const RestaurantLayout = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-slate-100">

            <RestaurantSidebar />

            <div className="flex flex-1 flex-col">

                <RestaurantHeader />

                <main className="flex-1 p-8">
                    {children}
                </main>

            </div>

        </div>
    );
};

export default RestaurantLayout;
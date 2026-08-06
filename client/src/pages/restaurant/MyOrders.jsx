import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { getRestaurantOrders } from "../../services/orderService";
import RestaurantOrderCard from "../../components/order/RestaurantOrderCard";
import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";

const RestaurantOrders = () => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {

        try {

            const response = await getRestaurantOrders();

            setOrders(response.orders);

        } catch (error) {

            toast.error(
                error.response?.data?.message ||
                "Failed to load orders."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        fetchOrders();

    }, []);

    if (loading) {
        return <p>Loading orders...</p>;
    }

return (

    <RestaurantLayout>

        <div className="p-6 space-y-6">

            <div>

                <h1 className="text-3xl font-bold mb-4">

                    My Orders

                </h1>

                <p className="text-gray-500">

                    Orders placed with suppliers.

                </p>

            </div>

            {orders.length === 0 ? (

                <div className="bg-white rounded-xl border p-8 text-center">

                    No orders found.

                </div>

            ) : (

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {orders.map((order) => (

                        <RestaurantOrderCard
                            key={order._id}
                            order={order}
                        />

                    ))}

                </div>

            )}

        </div>

    </RestaurantLayout>

);}

export default RestaurantOrders;
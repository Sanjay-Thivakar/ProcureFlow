import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PackageCheck } from "lucide-react";

import { getRestaurantOrders } from "../../services/orderService";
import RestaurantOrderCard from "../../components/order/RestaurantOrderCard";
import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import Loader from "../../components/common/Loader";
import EmptyState from "../../components/ui/EmptyState";

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

                {loading ? (

                    <Loader />

                ) : orders.length === 0 ? (

                    <EmptyState
                        title="No orders yet"
                        description="Orders you place with suppliers will appear here."
                        icon={PackageCheck}
                    />

                ) : (

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {orders.map((order) => (

                        <RestaurantOrderCard
                            key={order._id}
                            order={order}
                            onPaymentSuccess={fetchOrders}
                        />

                    ))}

                </div>

            )}

        </div>

    </RestaurantLayout>

);}

export default RestaurantOrders;
import ActivityItem from "./ActivityItem";

const activities = [
    {
        title: "Rice quotation accepted",
        time: "2 hours ago",
        status: "success",
    },
    {
        title: "Chicken supplier responded",
        time: "5 hours ago",
        status: "pending",
    },
    {
        title: "Tomato quotation created",
        time: "Yesterday",
        status: "info",
    },
];

const RecentActivity = () => {

    return (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="mb-6 text-lg font-semibold text-slate-800">
                Recent Activity
            </h3>

            <div className="space-y-5">

                {activities.map((activity, index) => (

                    <ActivityItem
                        key={index}
                        {...activity}
                    />

                ))}

            </div>

        </div>

    );

};

export default RecentActivity;
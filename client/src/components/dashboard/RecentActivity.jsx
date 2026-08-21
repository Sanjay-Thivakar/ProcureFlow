import ActivityItem from "./ActivityItem";

const RecentActivity = ({ activities = [] }) => {

    return (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="mb-6 text-lg font-semibold text-slate-800">
                Recent Activity
            </h3>

            {activities.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-6">
                    No recent activity.
                </div>
            ) : (
                <div className="space-y-5">
                    {activities.map((activity, index) => (
                        <ActivityItem
                            key={index}
                            title={activity.title}
                            time={activity.time}
                            status={activity.status}
                        />
                    ))}
                </div>
            )}

        </div>

    );

};

export default RecentActivity;
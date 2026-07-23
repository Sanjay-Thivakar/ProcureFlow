import {
    CheckCircle2,
    Clock3,
    CircleDashed,
} from "lucide-react";

const statusStyles = {
    success: {
        icon: CheckCircle2,
        color: "bg-emerald-100 text-emerald-600",
    },
    pending: {
        icon: Clock3,
        color: "bg-amber-100 text-amber-600",
    },
    info: {
        icon: CircleDashed,
        color: "bg-indigo-100 text-indigo-600",
    },
};

const ActivityItem = ({
    title,
    time,
    status = "info",
}) => {

    const { icon: Icon, color } = statusStyles[status];

    return (

        <div className="flex items-start gap-4">

            <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}
            >
                <Icon size={18} />
            </div>

            <div className="flex-1">

                <h4 className="font-medium text-slate-800">
                    {title}
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                    {time}
                </p>

            </div>

        </div>

    );

};

export default ActivityItem;
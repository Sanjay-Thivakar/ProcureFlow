import React from "react";

const EmptyState = ({ title, description, icon: Icon }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
            {Icon && (
                <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4 flex items-center justify-center">
                    <Icon size={40} />
                </div>
            )}
            <h2 className="text-2xl font-bold text-slate-700">
                {title}
            </h2>
            <p className="mt-2 text-slate-500 max-w-sm">
                {description}
            </p>
        </div>
    );
};

export default EmptyState;

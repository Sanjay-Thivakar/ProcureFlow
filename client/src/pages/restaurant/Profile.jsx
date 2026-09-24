import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { User, Mail, Calendar, KeyRound } from "lucide-react";

import RestaurantLayout from "../../components/layout/restaurant/RestaurantLayout";
import Loader from "../../components/common/Loader";
import { getProfile } from "../../services/authService";

const ProfilePage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await getProfile();
                setUser(data.user);
            } catch (err) {
                console.error(err);
                const errMsg = err.response?.data?.message || "Failed to load profile.";
                setError(errMsg);
                toast.error(errMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const initials = user?.name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();

    return (
        <RestaurantLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800">
                        Profile
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Manage your account information.
                    </p>
                </div>

                {loading ? (
                    <Loader />
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
                        {error}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
                        {/* Header card info */}
                        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 font-bold text-white text-3xl shadow-md">
                                {initials}
                            </div>
                            <div className="text-center md:text-left space-y-1">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {user.name}
                                </h2>
                                <p className="text-sm font-semibold text-indigo-600 capitalize bg-indigo-50 px-3 py-1 rounded-full inline-block">
                                    {user.role} Account
                                </p>
                            </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800">
                                    Contact Information
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                                Full Name
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 mt-0.5">
                                                {user.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
                                            <Mail size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                                Email Address
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 mt-0.5">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800">
                                    Account Information
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
                                            <KeyRound size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                                Account Role
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 mt-0.5 capitalize">
                                                {user.role}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 rounded-lg text-slate-400">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                                                Member Since
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 mt-0.5">
                                                {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </RestaurantLayout>
    );
};

export default ProfilePage;

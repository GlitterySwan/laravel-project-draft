import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, User, MapPin, DollarSign } from 'lucide-react';
import axios from 'axios';

export default function ActiveBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchActiveBookings = useCallback(async () => {
        try {
            const response = await axios.get(route('admin.active-bookings'));
            setBookings(response.data.activeBookings);
            setError(null);
        } catch (err) {
            setError('Failed to load active bookings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveBookings();
        // Auto-refresh every 30 seconds for real-time monitoring
        const interval = setInterval(fetchActiveBookings, 30000);
        return () => clearInterval(interval);
    }, [fetchActiveBookings]);

    const overtimeCount = bookings.filter((b) => b.is_overtime).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Active Bookings Monitor</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            {bookings.length} active · {overtimeCount} overtime
                        </span>
                        <button onClick={fetchActiveBookings}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg">
                            Refresh
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Active Bookings Monitor" />

            <div className="p-6">
                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading active bookings…</div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">{error}</div>
                ) : bookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No active bookings at this time.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {bookings.map((booking) => (
                            <div
                                key={booking.id}
                                className={`rounded-2xl border p-5 shadow-sm ${
                                    booking.is_overtime
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-white border-gray-100'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {booking.facility_name}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                            <User className="h-3 w-3" />
                                            {booking.user_name}
                                        </p>
                                    </div>
                                    {booking.is_overtime && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 rounded-full">
                                            <AlertTriangle className="h-3 w-3" /> OVERTIME
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5 text-xs text-gray-600">
                                    <p className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        {booking.start_time} – {booking.end_time}
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                        {booking.date}
                                    </p>
                                    {booking.is_overtime && (
                                        <p className="flex items-center gap-1.5 text-red-600 font-medium">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                            {booking.overtime_minutes} min overtime
                                        </p>
                                    )}
                                    {booking.overtime_fee > 0 && (
                                        <p className="flex items-center gap-1.5 text-amber-700 font-medium">
                                            <DollarSign className="h-3.5 w-3.5" />
                                            Accrued fee: ₱{booking.overtime_fee.toFixed(2)} (₱{booking.overtime_fee_per_hour}/hr)
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
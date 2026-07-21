import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Calendar, Building2, Clock } from 'lucide-react';

function StatusBadge({ status }) {
    const styles = {
        pending:   'bg-amber-50 text-amber-700 ring-amber-600/20',
        approved:  'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        declined:  'bg-red-50 text-red-700 ring-red-600/20',
        cancelled: 'bg-gray-100 text-gray-500 ring-gray-500/20',
    };
    const label = {
        pending: 'Pending',
        approved: 'Confirmed',
        declined: 'Declined',
        cancelled: 'Cancelled',
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] ?? styles.pending}`}>
            {label[status] ?? status}
        </span>
    );
}

export default function Dashboard({ auth, stats, upcomingBooking, recentActivities }) {
    const metrics = stats || { totalBookings: 0, activeRooms: 0, pendingRequests: 0 };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:px-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">ReserveIT</p>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back, {auth.user.name}</h1>
                        <p className="mt-1 text-sm text-gray-500">Here is what is happening across your bookings today.</p>
                    </div>
                    
                    {/* Action Container: Bell + Button */}
                    <div className="flex items-center gap-3">
                        
                        
                        <Link
                            href={route('facilities.index')}
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 whitespace-nowrap"
                        >
                            + Book a Facility
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Stat Badges */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-indigo-50 p-3 text-xl">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Your Active Bookings</p>
                                <p className="mt-1 text-3xl font-semibold text-gray-900">{metrics.totalBookings}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-emerald-50 p-3 text-xl">
                                <Building2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Available Venues</p>
                                <p className="mt-1 text-3xl font-semibold text-gray-900">{metrics.activeRooms}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="rounded-2xl bg-amber-50 p-3 text-xl">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                                <p className="mt-1 text-3xl font-semibold text-gray-900">{metrics.pendingRequests}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-base font-semibold text-gray-900">Next Upcoming Reservation</h2>

                            {upcomingBooking ? (
                                <div className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-slate-900">{upcomingBooking.facility?.name ?? 'Facility'}</h3>
                                        <p className="text-sm text-slate-600">📅 {upcomingBooking.date}</p>
                                        <p className="text-sm text-slate-600">⏰ {upcomingBooking.start_time} - {upcomingBooking.end_time}</p>
                                    </div>
                                    <StatusBadge status={upcomingBooking.status} />
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center">
                                    <p className="text-sm text-gray-500">No scheduled bookings upcoming.</p>
                                    <Link href={route('facilities.index')} className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        Browse availability →
                                    </Link>
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h2 className="mb-2 text-base font-semibold text-gray-900">Booking Guidelines</h2>
                            <p className="mb-4 text-xs text-gray-500">Please carefully read these instructions for booking a facility.</p>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex items-start gap-2"><span>•</span> Confirmations may take up to 24 hours.</li>
                                <li className="flex items-start gap-2"><span>•</span> Clean as you go, maintain tidiness in facilities before and after using.</li>
                                <li className="flex items-start gap-2"><span>•</span> Double check the informations you provided before submission.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
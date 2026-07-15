import React, { useState } from 'react';
import { Link, Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Calendar, Clock, MapPin, CheckCircle, Clock3, XCircle, ExternalLink, X, RefreshCw, AlertTriangle, History } from 'lucide-react';
import { toast } from 'sonner';

export default function MyBookings({ auth, bookings, activityLogs }) {
    const [cancelModalId, setCancelModalId] = useState(null);

    // Sort bookings: newest first
    const userBookings = [...bookings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="h-5 w-5 text-green-500 mr-1.5" />;
            case 'pending': return <Clock3 className="h-5 w-5 text-amber-500 mr-1.5" />;
            case 'declined': return <XCircle className="h-5 w-5 text-red-500 mr-1.5" />;
            case 'cancelled': return <AlertTriangle className="h-5 w-5 text-gray-500 mr-1.5" />;
            default: return null;
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 border-green-200';
            case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'declined': return 'bg-red-100 text-red-800 border-red-200';
            case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handleCancel = (id) => {
        // Send cancellation request to Laravel backend
        router.put(`/bookings/${id}/cancel`, {}, {
            onSuccess: () => {
                setCancelModalId(null);
                toast.success('Booking Cancelled', { description: 'Admin has been notified.' });
            },
            onError: () => {
                toast.error('Failed to cancel booking');
            }
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">My Reservations</h2>}
        >
            <Head title="My Bookings" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Bookings</h1>
                        <p className="mt-2 text-sm text-gray-500">Manage your upcoming facility reservations</p>
                    </div>

                    {userBookings.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                            <p className="mt-2 text-sm text-gray-500 mb-6">You haven't made any facility reservations yet.</p>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Browse Facilities
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                            {userBookings.map((booking) => {
                                const facility = booking.facility; // Eager loaded from Laravel relation
                                if (!facility) return null;
                                
                                const isCancelable = booking.status === 'pending' || booking.status === 'approved';
                                const logs = activityLogs.filter(l => l.booking_id === booking.id);

                                return (
                                    <div key={booking.id} className="bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-200 transition-all hover:shadow-md flex flex-col">
                                        <div className="p-6 border-b border-gray-100 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 mb-2 uppercase tracking-wider">
                                                        {facility.type}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-gray-900">{facility.name}</h3>
                                                    <p className="text-xs text-gray-500 mt-1 uppercase">Ref: BKG-2026-{String(booking.id).padStart(6, '0')}</p>
                                                </div>
                                                <div className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-semibold shadow-sm ${getStatusBadgeClass(booking.status)}`}>
                                                    {getStatusIcon(booking.status)}
                                                    {booking.status}
                                                </div>
                                            </div>

                                            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="flex items-center text-sm">
                                                    <Calendar className="flex-shrink-0 mr-3 h-5 w-5 text-indigo-500" />
                                                    <span className="font-medium text-gray-900">
                                                        {new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <Clock className="flex-shrink-0 mr-3 h-5 w-5 text-indigo-500" />
                                                    <span className="text-gray-700 font-medium">{booking.start_time} - {booking.end_time}</span>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <MapPin className="flex-shrink-0 mr-3 h-5 w-5 text-gray-400" />
                                                    <span className="text-gray-600">{facility.location}</span>
                                                </div>
                                            </div>

                                            {/* Logs / History */}
                                            {logs.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center mb-2">
                                                        <History className="h-4 w-4 mr-1" /> Status History
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {logs.slice(0, 2).map(log => (
                                                            <li key={log.id} className="text-xs flex justify-between items-center bg-white border border-gray-100 rounded p-2">
                                                                <span className="font-medium text-gray-700">{log.action.replace('STATUS_', '')}</span>
                                                                <span className="text-gray-400">{new Date(log.created_at).toLocaleString()} by {log.performed_by}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200">
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                {booking.status === 'approved' && (
                                                    <Link
                                                        href={`/receipt/${booking.id}`}
                                                        className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-colors"
                                                    >
                                                        <ExternalLink className="mr-2 h-4 w-4" /> View Receipt
                                                    </Link>
                                                )}
                                                {isCancelable && (
                                                    <Link
                                                        href={`/facility/${facility.id}`}
                                                        className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" /> Reschedule
                                                    </Link>
                                                )}
                                            </div>
                                            
                                            {isCancelable && (
                                                <button
                                                    onClick={() => setCancelModalId(booking.id)}
                                                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <X className="mr-2 h-4 w-4" /> Cancel Booking
                                                </button>
                                            )}
                                        </div>

                                        {/* Cancel Confirmation Modal */}
                                        {cancelModalId === booking.id && (
                                            <div className="fixed inset-0 z-50 overflow-y-auto">
                                                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setCancelModalId(null)}></div>
                                                    <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                                                    <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                                                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                                            <div className="sm:flex sm:items-start">
                                                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                                                </div>
                                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                                                    <h3 className="text-lg font-medium text-gray-900">Cancel Booking</h3>
                                                                    <div className="mt-2">
                                                                        <p className="text-sm text-gray-500">
                                                                            Are you sure you want to cancel this booking for {facility.name} on {new Date(booking.date).toLocaleDateString()}?
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCancel(booking.id)}
                                                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                                                            >
                                                                Confirm Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setCancelModalId(null)}
                                                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                                            >
                                                                Keep Booking
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

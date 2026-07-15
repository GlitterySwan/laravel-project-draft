import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, User as UserIcon } from 'lucide-react';

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    declined: 'bg-red-50 text-red-700 ring-red-600/20',
};

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
            {status}
        </span>
    );
}

function PendingBookingCard({ booking, onAction, isProcessing }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{booking.facility?.name ?? 'Unknown Facility'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5" />
                        {booking.user?.name ?? booking.guest_name ?? 'Guest'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {booking.date} · {booking.start_time} - {booking.end_time}
                    </p>
                    {booking.notes && (
                        <p className="text-xs text-gray-400 mt-2 whitespace-pre-line line-clamp-3">{booking.notes}</p>
                    )}
                </div>
                <StatusBadge status={booking.status} />
            </div>

            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => onAction(booking.id, 'approve')}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button
                    onClick={() => onAction(booking.id, 'decline')}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" /> Decline
                </button>
            </div>
        </div>
    );
}

export default function Bookings({ pendingBookings = [], reviewedBookings = [] }) {
    const [processingId, setProcessingId] = useState(null);
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [declineBookingId, setDeclineBookingId] = useState(null);

    const handleAction = (bookingId, action) => {
        setProcessingId(bookingId);

        if (action === 'decline') {
            setDeclineBookingId(bookingId);
            setDeclineReason('');
            setDeclineModalOpen(true);
            setProcessingId(null);
            return;
        }

        router.patch(route('facilitator.bookings.approve', bookingId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Booking approved.');
            },
            onError: () => {
                toast.error('Something went wrong. Please try again.');
            },
            onFinish: () => {
                setProcessingId(null);
            },
        });
    };

    const submitDecline = (e) => {
        e.preventDefault();
        setProcessingId(declineBookingId);

        router.patch(route('facilitator.bookings.decline', declineBookingId), {
            rejection_reason: declineReason.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Booking declined.');
                setDeclineModalOpen(false);
            },
            onError: () => {
                toast.error('Something went wrong. Please try again.');
            },
            onFinish: () => {
                setProcessingId(null);
                setDeclineBookingId(null);
            },
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold text-gray-900">Booking Approvals</h1>}>
            <Head title="Booking Approvals" />

            <div className="space-y-8 p-6">
                <div>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                        Pending ({pendingBookings.length})
                    </h2>

                    {pendingBookings.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                            <p className="text-sm text-gray-400">No pending bookings right now.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingBookings.map((booking) => (
                                <PendingBookingCard
                                    key={booking.id}
                                    booking={booking}
                                    onAction={handleAction}
                                    isProcessing={processingId === booking.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">Recent Decisions</h2>

                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Facility</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Requested By</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {reviewedBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                                            No reviewed bookings yet.
                                        </td>
                                    </tr>
                                ) : (
                                    reviewedBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{booking.facility?.name ?? 'Unknown'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{booking.user?.name ?? booking.guest_name ?? 'Guest'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{booking.date}</td>
                                            <td className="px-6 py-4"><StatusBadge status={booking.status} /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {declineModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-600">Decline booking</p>
                            <h3 className="mt-1 text-xl font-semibold text-gray-900">Add a reason for the rejection</h3>
                        </div>

                        <form onSubmit={submitDecline} className="space-y-4">
                            <textarea
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                rows={5}
                                className="block w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                                placeholder="Share a short reason for the decline..."
                                required
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeclineModalOpen(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                type="submit"
                                disabled={processingId === declineBookingId || declineReason.trim().length === 0}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Save reason
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

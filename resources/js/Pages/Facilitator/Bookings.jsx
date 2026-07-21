import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Clock, User as UserIcon, Eye, Calendar, Users, Search, FileText } from 'lucide-react';

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

function PendingBookingCard({ booking, onView, onApprove, onDecline, isProcessing }) {
    return (
        <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer transition hover:shadow-md hover:border-gray-200"
            onClick={() => onView(booking)}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{booking.facility?.name ?? 'Unknown Facility'}</h3>
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{booking.user?.name ?? booking.guest_name ?? 'Guest'}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        {booking.date} · {booking.start_time} - {booking.end_time}
                    </p>
                    {booking.notes && (
                        <p className="text-xs text-gray-400 mt-2 whitespace-pre-line line-clamp-2">{booking.notes}</p>
                    )}
                </div>
                <StatusBadge status={booking.status} />
            </div>

            <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onView(booking)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
                >
                    <Eye className="h-4 w-4" /> View
                </button>
                <button
                    onClick={() => onApprove(booking.id)}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition"
                >
                    <CheckCircle2 className="h-4 w-4" /> Approve
                </button>
                <button
                    onClick={() => onDecline(booking.id)}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold rounded-lg disabled:opacity-50 transition"
                >
                    <XCircle className="h-4 w-4" /> Decline
                </button>
            </div>
        </div>
    );
}

function BookingDetailModal({ booking, onClose }) {
    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 mb-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6A535C]">Booking Details</p>
                        <h3 className="mt-1 text-xl font-semibold text-gray-900">{booking.facility?.name ?? 'Unknown Facility'}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">✕</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Status</p>
                        <StatusBadge status={booking.status} />
                    </div>
                    <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Requested By</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-gray-400" />
                            {booking.user?.name ?? booking.guest_name ?? 'Guest'}
                        </p>
                        {(booking.user?.email || booking.guest_email) && (
                            <p className="text-xs text-gray-500 mt-0.5">{booking.user?.email ?? booking.guest_email}</p>
                        )}
                    </div>
                    <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Date & Time</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            {booking.date ?? booking.booking_date}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {booking.start_time} – {booking.end_time}
                        </p>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Attendees</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            {booking.attendees ?? 1} {booking.attendees === 1 ? 'person' : 'people'}
                        </p>
                        {booking.needs_manpower && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 mt-1">Needs manpower</span>
                        )}
                    </div>
                    {booking.guest_phone && (
                        <div className="rounded-xl bg-stone-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Contact Phone</p>
                            <p className="text-sm font-medium text-gray-900">{booking.guest_phone}</p>
                        </div>
                    )}
                    {booking.notes && (
                        <div className="rounded-xl bg-stone-50 p-4 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                        </div>
                    )}
                    {booking.decline_reason && (
                        <div className="rounded-xl bg-red-50 p-4 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">Decline Reason</p>
                            <p className="text-sm text-red-700">{booking.decline_reason}</p>
                        </div>
                    )}
                    {booking.approved_by && (
                        <div className="rounded-xl bg-emerald-50 p-4 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">Approved By</p>
                            <p className="text-sm text-emerald-700">{booking.approved_by} · {booking.approved_at ? new Date(booking.approved_at).toLocaleString() : ''}</p>
                        </div>
                    )}
                    {booking.consent_file_uploaded && (
                        <div className="rounded-xl bg-indigo-50 p-4 sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">Consent Letter</p>
                            <a
                                href={route('bookings.consent', booking.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900 underline"
                            >
                                <FileText className="h-4 w-4" />
                                {booking.consent_file_name || 'Download consent letter'}
                            </a>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="button" onClick={onClose} className="rounded-xl bg-[#6A535C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#533e45]">Close</button>
                </div>
            </div>
        </div>
    );
}

function ConfirmApproveModal({ bookingId, onConfirm, onCancel, isProcessing }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                <div className="mb-4 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Approve this booking?</h3>
                    <p className="mt-2 text-sm text-gray-500">This action will confirm the booking. You cannot undo this.</p>
                </div>
                <div className="flex gap-3 mt-6">
                    <button type="button" onClick={onCancel} disabled={isProcessing} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50">Cancel</button>
                    <button type="button" onClick={() => onConfirm(bookingId)} disabled={isProcessing} className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {isProcessing ? 'Approving…' : 'Yes, approve'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Bookings({ pendingBookings = [], reviewedBookings = [], filters = {} }) {
    const page = usePage();
    const user = page.props.auth?.user;
    const isSuperAdmin = user?.role === 'super_admin';
    
    // 🛡️ Rule 3 & 4 Protection: Dynamically build routing context
    const routePrefix = isSuperAdmin ? 'admin' : 'facilitator';

    const [processingId, setProcessingId] = useState(null);
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [declineBookingId, setDeclineBookingId] = useState(null);
    const [viewBooking, setViewBooking] = useState(null);
    const [confirmApproveId, setConfirmApproveId] = useState(null);

    // ── Search & Filter State ──────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');
    const debounceTimer = useRef(null);

    // 🔄 Sync local inputs when backend filters update (handles sidebar link clicks/resets)
    useEffect(() => {
        setSearchQuery(filters.search || '');
        setStatusFilter(filters.status || '');
    }, [filters.search, filters.status]);

    // 🔄 Rule 1 Setup: Mandatory 30-Second Client-Side Inertia Polling Engine
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['pendingBookings', 'reviewedBookings'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Debounced Inertia reload: fires 350ms after input updates
    const debouncedFilterReload = useCallback((search, status) => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            router.get(
                window.location.pathname, // 🪓 FIXED: Removed window.location.search to prevent duplication parameters
                { search: search || null, status: status || null },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
    }, []);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        debouncedFilterReload(val, statusFilter);
    };

    const handleStatusChange = (e) => {
        const val = e.target.value;
        setStatusFilter(val);
        debouncedFilterReload(searchQuery, val);
    };

    // ── Client-side search filters synchronized with backend datasets ──────
    const filteredPending = useMemo(() => {
        let result = pendingBookings;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (b) =>
                    b.facility?.name?.toLowerCase().includes(q) ||
                    b.user?.name?.toLowerCase().includes(q) ||
                    b.guest_name?.toLowerCase().includes(q),
            );
        }
        return result;
    }, [pendingBookings, searchQuery]);

    const filteredReviewed = useMemo(() => {
        let result = reviewedBookings;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (b) =>
                    b.facility?.name?.toLowerCase().includes(q) ||
                    b.user?.name?.toLowerCase().includes(q) ||
                    b.guest_name?.toLowerCase().includes(q),
            );
        }
        return result;
    }, [reviewedBookings, searchQuery]);

    const handleView = (booking) => setViewBooking(booking);

    const handleApproveClick = (bookingId) => setConfirmApproveId(bookingId);

    const confirmApprove = (bookingId) => {
        setProcessingId(bookingId);
        router.patch(route(`${routePrefix}.bookings.approve`, bookingId), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Booking approved.');
                setConfirmApproveId(null);
            },
            onError: () => toast.error('Something went wrong. Please try again.'),
            onFinish: () => setProcessingId(null),
        });
    };

    const handleDeclineClick = (bookingId) => {
        setDeclineBookingId(bookingId);
        setDeclineReason('');
        setDeclineModalOpen(true);
    };

    const submitDecline = (e) => {
        e.preventDefault();
        setProcessingId(declineBookingId);
        router.patch(route(`${routePrefix}.bookings.decline`, declineBookingId), {
            rejection_reason: declineReason.trim(),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Booking declined.');
                setDeclineModalOpen(false);
            },
            onError: () => toast.error('Something went wrong. Please try again.'),
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
                {/* ── Search & Filter Toolbar ─────────────────────────── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by facility, user or guest name…"
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="w-full sm:w-48 rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                    </select>
                </div>

                {/* ── Filter-Aware Card Section ─────────────────────────── */}
                {(!statusFilter || statusFilter === 'pending') && (
                    <div>
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                            Pending Decisions ({filteredPending.length})
                        </h2>

                        {filteredPending.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
                                <p className="text-sm text-gray-400">
                                    {searchQuery ? 'No pending bookings match your search.' : 'No pending bookings right now.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredPending.map((booking) => (
                                    <PendingBookingCard
                                        key={booking.id}
                                        booking={booking}
                                        onView={handleView}
                                        onApprove={handleApproveClick}
                                        onDecline={handleDeclineClick}
                                        isProcessing={processingId === booking.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Filter-Aware Recent Decisions Table ──────────────── */}
                {(!statusFilter || statusFilter !== 'pending') && (
                    <div>
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                            {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Decisions` : 'Recent Decisions'}
                        </h2>
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
                                    {filteredReviewed.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No matching decisions found.</td>
                                        </tr>
                                    ) : (
                                        filteredReviewed.map((booking) => (
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
                )}
            </div>

            {/* View Detail Modal */}
            <BookingDetailModal booking={viewBooking} onClose={() => setViewBooking(null)} />

            {/* Confirm Approve Modal */}
            {confirmApproveId && (
                <ConfirmApproveModal
                    bookingId={confirmApproveId}
                    onConfirm={confirmApprove}
                    onCancel={() => setConfirmApproveId(null)}
                    isProcessing={processingId === confirmApproveId}
                />
            )}

            {/* Decline Modal */}
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
                                <button type="button" onClick={() => setDeclineModalOpen(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">Cancel</button>
                                <button type="submit" disabled={processingId === declineBookingId || declineReason.trim().length === 0} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
                                    {processingId === declineBookingId ? 'Saving…' : 'Save reason'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
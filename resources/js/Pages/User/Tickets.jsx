import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Ticket, Clock, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';

const CATEGORY_COLORS = {
    Facility: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    'UI Improvements': 'bg-purple-50 text-purple-700 ring-purple-600/20',
    Account: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Bug: 'bg-red-50 text-red-700 ring-red-600/20',
    Others: 'bg-gray-50 text-gray-700 ring-gray-600/20',
};

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export default function Tickets({ tickets = [] }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Tickets</h1>
                        <p className="mt-1 text-sm text-gray-500">Track your submitted support tickets and view admin replies.</p>
                    </div>
                </div>
            }
        >
            <Head title="My Tickets" />

            <div className="space-y-4 p-6">
                {tickets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                        <Ticket className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-4 text-sm font-medium text-gray-500">No tickets submitted yet.</p>
                        <p className="mt-1 text-xs text-gray-400">Click the chat bubble button in the bottom-right corner to submit a ticket.</p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div key={ticket.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS.Others}`}>
                                            {ticket.category ?? 'Others'}
                                        </span>
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[ticket.status] ?? STATUS_STYLES.pending}`}>
                                            {ticket.status === 'pending' ? 'Open' : 'Resolved'}
                                        </span>
                                        <span className="text-xs text-gray-400">#{ticket.id}</span>
                                    </div>

                                    {ticket.appeal_date && (
                                        <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Clock className="h-3.5 w-3.5" />
                                            Appeal Date: {ticket.appeal_date}
                                        </p>
                                    )}

                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.detailed_info ?? ticket.message}</p>

                                    {ticket.admin_reply && (
                                        <div className="mt-3 rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                                            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                                                <MessageCircle className="h-3.5 w-3.5" />
                                                Admin Reply
                                            </p>
                                            <p className="text-sm text-emerald-800 whitespace-pre-wrap">{ticket.admin_reply}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}
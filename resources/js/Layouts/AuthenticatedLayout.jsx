import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    SquareTerminal,
    CalendarDays,
    Settings,
    LogOut,
    Building2,
    Users,
    ClipboardCheck,
    MessageSquareText,
    Bell,
    MessageCircleQuestion,
    Ticket,
    CalendarCheck,
} from 'lucide-react';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    facility_admin: 'Facility Admin',
    user: 'User',
};

function NavLink({ href, active, icon: Icon, children }) {
    return (
        <Link
            href={href}
            className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active
                    ? 'bg-[#846A75] text-white shadow-inner'
                    : 'text-purple-100 hover:bg-[#543F48] hover:text-white'
            }`}
        >
            <Icon className="mr-3 h-5 w-5 opacity-80" />
            {children}
        </Link>
    );
}

// Added the optional 'action' slot prop here
export default function AuthenticatedLayout({ header, action, children }) {
    const page = usePage();

    // ── Defensive user check ───────────────────────────────────────────────
    const user = page.props.auth?.user;
    const role = user?.role;
    const isSuperAdmin = role === 'super_admin';
    const isFacilityAdmin = role === 'facility_admin';
    const isUser = role === 'user';

    // ── Notification state & Dropdown Toggle ───────────────────────────────
    const [realtimeNotifications, setRealtimeNotifications] = useState(page.props.notifications ?? []);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [isClearingNotifications, setIsClearingNotifications] = useState(false);
    const [viewingNotification, setViewingNotification] = useState(null);
    const prevCountRef = useRef(realtimeNotifications.length);

    // Unread notifications drive the badge/dot — notifications persist in the
    // DB even after being "cleared" (marked read), so total length alone
    // isn't a useful signal here.
    const unreadCount = realtimeNotifications.filter((n) => !n.read).length;

    // Sync when Inertia re-shares props
    useEffect(() => {
        setRealtimeNotifications(page.props.notifications ?? []);
    }, [page.props.notifications]);

    // ── Inertia Polling: every 30 seconds ──────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            router.reload({
                only: ['notifications'],
                preserveScroll: true,
                preserveState: true,
                onSuccess: (updatedPage) => {
                    const freshNotifications = updatedPage.props.notifications ?? [];
                    const freshUnreadCount = freshNotifications.filter((n) => !n.read).length;
                    const prevCount = prevCountRef.current;

                    if (freshUnreadCount > prevCount) {
                        const newOnes = freshUnreadCount - prevCount;
                        toast.message(`${newOnes} new notification${newOnes > 1 ? 's' : ''}`, {
                            description: 'You have unread updates. Check the bell icon.',
                        });
                    }

                    prevCountRef.current = freshUnreadCount;
                    setRealtimeNotifications(freshNotifications);
                },
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // ── Clear all notifications (marks unread as read in the DB) ───────────
    const clearAllNotifications = () => {
        setIsClearingNotifications(true);
        router.post(
            route('notifications.clear'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setIsClearingNotifications(false),
            },
        );
    };

    const [helpOpen, setHelpOpen] = useState(false);

    // Ticket form state
    const [ticketAppealDate, setTicketAppealDate] = useState('');
    const [ticketCategory, setTicketCategory] = useState('');
    const [ticketDetailedInfo, setTicketDetailedInfo] = useState('');
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

    // Flash toast messages
    useEffect(() => {
        const toastData = page.props.flash?.toast;
        if (!toastData?.message) return;

        if (toastData.type === 'error') {
            toast.error(toastData.message, { duration: 4000 });
        } else {
            toast.success(toastData.message, { duration: 4000 });
        }

        page.props.flash.toast = null;
    }, [page.props.flash?.toast]);

    const submitTicket = (e) => {
        e.preventDefault();
        setIsSubmittingTicket(true);

        router.post(
            route('concerns.store'),
            {
                appeal_date: ticketAppealDate || null,
                category: ticketCategory || null,
                detailed_info: ticketDetailedInfo,
                message: ticketDetailedInfo,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setHelpOpen(false);
                    setTicketAppealDate('');
                    setTicketCategory('');
                    setTicketDetailedInfo('');
                },
                onFinish: () => setIsSubmittingTicket(false),
            },
        );
    };

    return (
        <div className="flex min-h-screen bg-[#FDF6F0]">
            {/* Sidebar Navigation */}
            <aside className="fixed z-20 flex h-full w-64 flex-col justify-between bg-[#6A535C] text-white shadow-xl">
                <div>
                    <div className="flex items-center gap-2 border-b border-[#543F48] p-6">
                        <div className="text-2xl font-serif font-bold tracking-tight">
                            <span className="mr-0.5 rounded border-2 border-white px-1.5 shadow-sm">R</span>eservedIT
                        </div>
                    </div>

                    <nav className="mt-6 space-y-1 px-3">
                        <NavLink href={route('dashboard')} active={route().current('dashboard')} icon={LayoutDashboard}>
                            Dashboard
                        </NavLink>

                        <NavLink href={route('facilities.index')} active={route().current('facilities.index')} icon={SquareTerminal}>
                            Facilities
                        </NavLink>

                        <NavLink href={route('schedule.index')} active={route().current('schedule.index')} icon={CalendarDays}>
                            Schedule Grid
                        </NavLink>

                        {isUser && (
                            <>
                                <NavLink
                                    href={route('bookings.index')}
                                    active={route().current('bookings.index')}
                                    icon={CalendarCheck}
                                >
                                    My Bookings
                                </NavLink>
                                <NavLink
                                    href={route('concerns.my-tickets')}
                                    active={route().current('concerns.my-tickets')}
                                    icon={Ticket}
                                >
                                    My Tickets
                                </NavLink>
                            </>
                        )}

                        {isFacilityAdmin && (
                            <NavLink
                                href={route('facilitator.bookings.index')}
                                active={route().current('facilitator.bookings.index')}
                                icon={ClipboardCheck}
                            >
                                Booking Approvals
                            </NavLink>
                        )}

                        {isSuperAdmin && (
                            <>
                                <div className="px-4 pb-1 pt-4 text-[10px] font-bold uppercase tracking-widest text-purple-200/60">
                                    Admin
                                </div>
                                <NavLink
                                    href={route('admin.bookings.index')}
                                    active={route().current('admin.bookings.index')}
                                    icon={ClipboardCheck}
                                >
                                    Booking Approvals
                                </NavLink>
                                <NavLink
                                    href={route('admin.facilities.index')}
                                    active={route().current('admin.facilities.index')}
                                    icon={Building2}
                                >
                                    Manage Facilities
                                </NavLink>
                                <NavLink
                                    href={route('admin.users.index')}
                                    active={route().current('admin.users.index')}
                                    icon={Users}
                                >
                                    Manage Users
                                </NavLink>
                                <NavLink
                                    href={route('admin.concerns.index')}
                                    active={route().current('admin.concerns.index')}
                                    icon={MessageSquareText}
                                >
                                    User Concerns
                                </NavLink>
                                <NavLink href={route('admin.settings.edit')} active={route().current('admin.settings.edit')} icon={Settings}>Booking Settings</NavLink>
                            </>
                        )}
                    </nav>
                </div>

                {/* Sidebar Footer Context Actions */}
                <div className="border-t border-[#543F48] bg-[#5C4750] p-4">
                    {/* User Profile Badge */}
                    <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#4E3A43]/50 p-2.5 border border-[#543F48]/40">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#6A535C]">
                            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate leading-tight">{user?.name ?? 'User'}</p>
                            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-purple-200/70 truncate mt-0.5">
                                {ROLE_LABELS[role] ?? role ?? 'Guest'}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={route('profile.edit')}
                        className="mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-purple-100 transition-colors hover:bg-[#4E3A43] hover:text-white"
                    >
                        <Settings className="h-4 w-4 opacity-70" />
                        Settings
                    </Link>

                    <Link
                        method="post"
                        href={route('logout')}
                        as="button"
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-rose-200 transition-colors hover:bg-rose-900/30 hover:text-white"
                    >
                        <LogOut className="h-4 w-4 opacity-70" />
                        Logout
                    </Link>
                </div>
            </aside>

            {/* Main Workspace */}
            <div className="ml-64 flex min-h-screen flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-gray-200/70 bg-white/80 px-4 py-4 sm:px-8">
                    {/* Title stays on the left */}
                    <div className="min-w-0 flex-1">{header}</div>

                    {/* Actions container: Positions the interactive Bell right before the page button */}
                    <div className="ml-4 flex items-center gap-4">

                        {/* Interactive Notification Bell Container */}
                        <div className="relative flex items-center">
                            <button
                                onClick={() => setNotificationsOpen(!notificationsOpen)}
                                className="relative rounded-xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
                            >
                                <span className="sr-only">View notifications</span>
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                                )}
                            </button>

                            {/* Notifications Dropdown Panel */}
                            {notificationsOpen && (
                                <>
                                    {/* Click-away overlay standard backdrop */}
                                    <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 z-40 w-80 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl ring-1 ring-black/5">
                                        <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Notifications</span>
                                            <div className="flex items-center gap-2">
                                                {unreadCount > 0 && (
                                                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-[#6A535C]">
                                                        {unreadCount} New
                                                    </span>
                                                )}
                                                {unreadCount > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={clearAllNotifications}
                                                        disabled={isClearingNotifications}
                                                        className="text-[10px] font-semibold text-indigo-600 transition hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isClearingNotifications ? 'Clearing…' : 'Clear all'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                            {realtimeNotifications.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-gray-400">
                                                    All caught up! No new notifications.
                                                </div>
                                            ) : (
                                                realtimeNotifications.map((notification, index) => (
                                                    <button
                                                        key={notification.id || index}
                                                        type="button"
                                                        onClick={() => {
                                                            // Mark as read in DB
                                                            if (!notification.read) {
                                                                router.post(route('notifications.read', notification.id), {}, {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                });
                                                            }
                                                            // Open detail modal
                                                            setViewingNotification(notification);
                                                            setNotificationsOpen(false);
                                                        }}
                                                        className={`w-full text-left rounded-xl p-2.5 text-xs transition hover:bg-gray-50 ${
                                                            notification.read ? 'text-gray-500' : 'bg-purple-50/60 text-gray-600'
                                                        }`}
                                                    >
                                                        <p className={`font-semibold ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                                            {notification.title || 'System Notification'}
                                                        </p>
                                                        <p className="mt-0.5 text-gray-500">{notification.message || 'Update details received.'}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Page-level dynamic action button slot */}
                        {action && (
                            <div className="flex items-center shrink-0">
                                {action}
                            </div>
                        )}

                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-8">
                    {children}
                </main>
            </div>

            {/* Notification Detail Modal */}
            {viewingNotification && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setViewingNotification(null)}>
                    <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6A535C]">Notification</p>
                                <h3 className="mt-1 text-xl font-semibold text-gray-900">{viewingNotification.title || 'System Notification'}</h3>
                            </div>
                            <button type="button" onClick={() => setViewingNotification(null)} className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">✕</button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingNotification.message || 'No additional details.'}</p>
                        <div className="mt-6 flex justify-end">
                            <button type="button" onClick={() => setViewingNotification(null)} className="rounded-xl bg-[#6A535C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#533e45]">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Support Ticket Float Trigger */}
            <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#6A535C] text-xl font-semibold text-white shadow-lg transition hover:bg-[#533e45]"
                aria-label="Submit a ticket"
            >
                <MessageCircleQuestion className="h-6 w-6" />
            </button>

            {/* Support Ticket Modal Dialog */}
            {helpOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6A535C]">Submit a Ticket</p>
                                <h3 className="mt-1 text-xl font-semibold text-gray-900">Report an issue or share feedback</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setHelpOpen(false)}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={submitTicket} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Appeal Date</label>
                                <input
                                    type="date"
                                    value={ticketAppealDate}
                                    onChange={(e) => setTicketAppealDate(e.target.value)}
                                    className="block w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Concern Category</label>
                                <select
                                    value={ticketCategory}
                                    onChange={(e) => setTicketCategory(e.target.value)}
                                    className="block w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="">Select a category…</option>
                                    <option value="Facility">Facility</option>
                                    <option value="UI Improvements">UI Improvements</option>
                                    <option value="Account">Account</option>
                                    <option value="Bug">Bug</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Detailed Information</label>
                                <textarea
                                    value={ticketDetailedInfo}
                                    onChange={(e) => setTicketDetailedInfo(e.target.value)}
                                    rows={5}
                                    className="block w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    placeholder="Describe the issue or feedback in detail…"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setHelpOpen(false)}
                                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingTicket || ticketDetailedInfo.trim().length === 0}
                                    className="rounded-xl bg-[#6A535C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#533e45] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmittingTicket ? 'Submitting…' : 'Submit a ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
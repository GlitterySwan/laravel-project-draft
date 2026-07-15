import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

export default function AuthenticatedLayout({ header, children }) {
    const page = usePage();
    const user = page.props.auth.user;
    const isSuperAdmin = user.role === 'super_admin';
    const isFacilityAdmin = user.role === 'facility_admin';
    const notifications = page.props.notifications ?? [];
    const unreadCount = notifications.filter((notification) => !notification.read).length;

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [helpMessage, setHelpMessage] = useState('');
    const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

    useEffect(() => {
        const notification = page.props.flash?.toast;
        if (!notification?.message) return;

        toast[notification.type === 'error' ? 'error' : 'success'](notification.message, { duration: 4000 });
    }, [page.props.flash?.toast]);

    const submitHelpMessage = (e) => {
        e.preventDefault();
        setIsSubmittingHelp(true);

        router.post(
            route('concerns.store'),
            { message: helpMessage },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setHelpOpen(false);
                    setHelpMessage('');
                },
                onFinish: () => setIsSubmittingHelp(false),
            },
        );
    };

    return (
        <div className="flex min-h-screen bg-[#FDF6F0]">
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
                            Calendar
                        </NavLink>

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
                                    href={route('facilitator.bookings.index')}
                                    active={route().current('facilitator.bookings.index')}
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

                <div className="border-t border-[#543F48] bg-[#5C4750] p-4">
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

            <div className="ml-64 flex min-h-screen flex-1 flex-col">
                <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/70 bg-white/80 px-4 py-4 sm:px-8">
                    <div className="min-w-0 flex-1">{header}</div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setNotificationsOpen((value) => !value)}
                                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-slate-900"
                                aria-label="View notifications"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {notificationsOpen && (
                                <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
                                    <div className="mb-2 flex items-center justify-between px-1">
                                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                        <span className="text-xs text-gray-500">Latest updates</span>
                                    </div>
                                    <div className="space-y-2">
                                        {notifications.slice(0, 5).map((notification) => (
                                            <div key={notification.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6A535C] text-sm font-bold text-white">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                                    {ROLE_LABELS[user.role] ?? user.role}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 sm:p-8">
                    {children}
                </main>
            </div>

            <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#6A535C] text-xl font-semibold text-white shadow-lg transition hover:bg-[#533e45]"
                aria-label="Contact support"
            >
                <MessageCircleQuestion className="h-6 w-6" />
            </button>

            {helpOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6A535C]">Send a concern</p>
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

                        <form onSubmit={submitHelpMessage} className="space-y-4">
                            <textarea
                                value={helpMessage}
                                onChange={(e) => setHelpMessage(e.target.value)}
                                rows={6}
                                className="block w-full rounded-2xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                placeholder="Describe the issue or feedback for the Super Admin..."
                            />

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
                                    disabled={isSubmittingHelp || helpMessage.trim().length === 0}
                                    className="rounded-xl bg-[#6A535C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#533e45] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmittingHelp ? 'Sending…' : 'Send message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

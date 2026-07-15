import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

function Stat({ label, value }) {
    return <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#6A535C]">{value}</p></div>;
}

export default function AdminDashboard({ stats, usageOverTime = [], mostUsedFacilities = [], pendingBookings = [], recentConcerns = [] }) {
    const maximum = Math.max(...usageOverTime.map((item) => item.bookings), 1);

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Super Admin Dashboard</h1>}>
            <Head title="Admin Dashboard" />
            <div className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Total facilities" value={stats.totalFacilities} /><Stat label="All bookings" value={stats.totalBookings} />
                    <Stat label="Pending approval" value={stats.pendingApprovals} /><Stat label="Pending concerns" value={stats.pendingConcerns} />
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Booking volume over time</h2>
                        <div className="mt-6 flex h-44 items-end gap-3">{usageOverTime.map((item) => <div key={item.label} className="flex flex-1 flex-col items-center gap-2"><span className="text-xs font-semibold">{item.bookings}</span><div className="w-full rounded-t-lg bg-[#846A75]" style={{ height: `${(item.bookings / maximum) * 100}%`, minHeight: item.bookings ? '8px' : '2px' }} /><span className="text-[10px] text-slate-500">{item.label}</span></div>)}</div>
                    </section>
                    <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Most used facilities</h2>
                        <div className="mt-4 space-y-3">{mostUsedFacilities.length ? mostUsedFacilities.map((facility) => <div key={facility.name} className="flex justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"><span>{facility.name}</span><span className="font-semibold text-[#6A535C]">{facility.bookings} bookings</span></div>) : <p className="text-sm text-slate-500">No booking data yet.</p>}</div>
                    </section>
                </div>
                <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Pending bookings</h2><Link href={route('facilitator.bookings.index')} className="text-sm font-semibold text-[#6A535C]">Open approvals</Link></div>
                    <div className="mt-4 space-y-3">{pendingBookings.length ? pendingBookings.map((booking) => <div key={booking.id} className="flex flex-col gap-3 rounded-xl border border-stone-100 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{booking.facility?.name}</p><p className="text-xs text-slate-500">{booking.user?.name ?? booking.guest_name ?? 'Guest'} · {booking.booking_date} · {booking.start_time}–{booking.end_time}</p></div><button type="button" onClick={() => router.patch(route('facilitator.bookings.approve', booking.id), {}, { preserveScroll: true })} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Approve</button></div>) : <p className="text-sm text-slate-500">No bookings awaiting review.</p>}</div>
                </section>
                <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex justify-between"><h2 className="font-semibold text-slate-900">Recent concerns</h2><Link href={route('admin.concerns.index')} className="text-sm font-semibold text-[#6A535C]">View all</Link></div>{recentConcerns.map((concern) => <p key={concern.id} className="mt-3 border-t border-stone-100 pt-3 text-sm">{concern.message} <span className="text-xs text-slate-500">— {concern.user?.name ?? 'Guest'}</span></p>)}</section>
            </div>
        </AuthenticatedLayout>
    );
}

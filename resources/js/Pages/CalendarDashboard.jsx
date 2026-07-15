import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { CalendarView } from './CalendarView';

export default function CalendarDashboard({ serverFacilities, serverBookings, selectedDate }) {
    return <AuthenticatedLayout><Head title="Calendar Schedule" /><div className="mx-auto max-w-[1600px]"><div className="rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-slate-900">Facility schedule</h1><p className="text-sm text-slate-500">Review availability and booking conflicts by day.</p></div><label className="text-sm font-medium text-slate-600">Schedule date<input type="date" value={selectedDate} onChange={(event) => router.get(route('schedule.index'), { date: event.target.value }, { preserveState: false })} className="ml-2 rounded-lg border border-stone-200 px-3 py-2" /></label></div><CalendarView serverFacilities={serverFacilities} serverBookings={serverBookings} selectedDate={selectedDate} /></div></div></AuthenticatedLayout>;
}

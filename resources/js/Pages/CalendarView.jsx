import { useState } from 'react';
import { X as XIcon } from 'lucide-react';
import BookingModal from '@/Components/BookingModal';

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const toMinutes = (time) => { const [hour, minute] = String(time).split(':').map(Number); return hour * 60 + (minute || 0); };
const statusClass = (status) => status === 'approved' ? 'from-emerald-500 to-emerald-600' : 'from-amber-400 to-amber-500';

function bookingCluster(bookings, slotMinute) {
    let cluster = bookings.filter((booking) => toMinutes(booking.start_time) <= slotMinute && toMinutes(booking.end_time) > slotMinute);
    let clusterEnd = Math.max(...cluster.map((booking) => toMinutes(booking.end_time)));
    let changed = true;
    while (changed) {
        changed = false;
        bookings.forEach((booking) => {
            const start = toMinutes(booking.start_time); const end = toMinutes(booking.end_time);
            if (start < clusterEnd && end > slotMinute && !cluster.some((item) => item.id === booking.id)) { cluster.push(booking); clusterEnd = Math.max(clusterEnd, end); changed = true; }
        });
    }
    return { cluster, clusterEnd };
}

export function CalendarView({ serverFacilities = [], serverBookings = [], selectedDate }) {
    const [details, setDetails] = useState(null); const [create, setCreate] = useState(null);
    return (
        <>
            <div className="w-full overflow-x-auto whitespace-nowrap rounded-2xl border border-stone-200">
                <table className="min-w-[1400px] w-full table-fixed border-collapse">
                    <thead className="bg-stone-50">
                        <tr>
                            <th className="w-64 border-b border-r p-3 text-left text-sm font-semibold text-stone-700">Facility</th>
                            {HOURS.map((hour) => (
                                <th key={hour} className="w-24 border-b border-r p-3 text-center text-xs font-medium text-stone-500">
                                    {hour}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {serverFacilities.map((facility) => {
                            const bookings = serverBookings.filter((booking) => booking.facility_id === facility.id).sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time));
                            const cells = [];
                            let index = 0;
                            while (index < HOURS.length) {
                                const slot = HOURS[index];
                                const { cluster, clusterEnd } = bookingCluster(bookings, toMinutes(slot));
                                if (cluster.length) {
                                    const span = Math.min(HOURS.length - index, Math.max(1, Math.ceil((clusterEnd - toMinutes(slot)) / 60)));
                                    cells.push(
                                        <td key={slot} colSpan={span} className="border-b border-r p-1.5 align-top">
                                            <button type="button" onClick={() => setDetails({ facility, bookings: cluster })} className={`min-h-[64px] w-full rounded-xl bg-gradient-to-r ${statusClass(cluster.some((booking) => booking.status === 'approved') ? 'approved' : 'pending')} px-3 py-2 text-left text-white shadow-sm transition hover:brightness-95`}>
                                                <span className="block text-xs font-bold uppercase">{cluster.length > 1 ? `${cluster.length} conflicting bookings` : cluster[0].status}</span>
                                                <span className="mt-1 block text-sm font-semibold">{cluster.length === 1 ? `${cluster[0].start_time}–${cluster[0].end_time}` : `${slot}–${String(Math.floor(clusterEnd / 60)).padStart(2, '0')}:00`}</span>
                                            </button>
                                        </td>
                                    );
                                    index += span;
                                } else {
                                    cells.push(
                                        <td key={slot} colSpan={1} className="border-b border-r p-1.5">
                                            <button type="button" onClick={() => setCreate({ facility, startTime: slot })} className="flex min-h-[64px] w-full items-center justify-center rounded-xl border border-dashed border-stone-300 text-lg text-stone-400 hover:border-[#846A75] hover:text-[#6A535C]">
                                                +
                                            </button>
                                        </td>
                                    );
                                    index += 1;
                                }
                            }
                            return (
                                <tr key={facility.id}>
                                    <th className="border-b border-r bg-white p-3 text-left align-top whitespace-normal">
                                        <p className="text-sm font-semibold text-stone-800">{facility.name}</p>
                                        <p className="mt-1 text-xs font-normal text-slate-500">{facility.location}</p>
                                    </th>
                                    {cells}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {details && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
                    <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex justify-between">
                            <div>
                                <p className="text-sm font-semibold text-[#6A535C]">Booking details</p>
                                <h3 className="text-xl font-bold">{details.facility.name}</h3>
                            </div>
                            <button onClick={() => setDetails(null)} className="text-slate-500">Close</button>
                        </div>
                        <div className="mt-5 space-y-3">
                            {details.bookings.map((booking) => (
                                <article key={booking.id} className="rounded-xl border border-stone-200 p-4">
                                    <p className="font-bold">{booking.user?.name ?? booking.guest_name ?? 'Guest'}</p>
                                    <p className="text-sm text-slate-600">{booking.status} · {booking.start_time}–{booking.end_time}</p>
                                    <p className="mt-1 text-sm">Contact: {booking.user?.email ?? booking.guest_email ?? 'Not supplied'}</p>
                                    <p className="mt-1 text-sm">Purpose: {booking.notes || 'Not supplied'}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {create && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCreate(null)} />
                    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                            <div>
                                <h2 className="font-bold text-gray-900">Book {create.facility.name}</h2>
                            </div>
                            <button onClick={() => setCreate(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <BookingModal facility={create.facility} selectedDate={selectedDate} selectedStartTime={create.startTime} existingBookings={serverBookings.filter(b => b.facility_id === create.facility.id)} onClose={() => setCreate(null)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
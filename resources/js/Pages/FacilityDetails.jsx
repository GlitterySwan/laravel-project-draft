import React, { useState, useMemo } from 'react';
import { usePage, router } from '@inertiajs/react';
import {
  Users, MapPin, AlertCircle, FileText, CheckCircle2, Calendar as CalendarIcon,
  Clock, ArrowLeft, User as UserIcon, BadgeCheck, Upload, X,
  ShieldCheck, AlertTriangle,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// Booking Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function BookingModal({ facility, blackoutDates, bookings, availablePersonnel, onClose }) {
  // Pull authenticated user from global Inertia shared data
  const { auth } = usePage().props;
  const user = auth?.user;

  const [iotPersonnel, setIotPersonnel] = useState(availablePersonnel?.[0]?.name || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [eventName, setEventName] = useState('');
  const [file, setFile] = useState(null);
  const [needsManpower, setNeedsManpower] = useState(false);
  const [facilitator, setFacilitator] = useState('');
  
  // Guest fields (only used if unauthenticated)
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [conflictError, setConflictError] = useState('');

  // ── Consent & Lead-Time Rules ──────────────────────────────────────────────
  const isWeekend = (d) => { if (!d) return false; const day = new Date(d).getDay(); return day === 0 || day === 6; };
  const isWeekendBooking = isWeekend(date);
  const isAlwaysConsent = facility.requirement === 'CONSENT_REQUIRED';
  const isConsentRequired = isAlwaysConsent || (facility.requiresWeekendConsent && isWeekendBooking);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const minDate = useMemo(() => {
    if (isAlwaysConsent) {
      const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0];
    }
    return todayStr;
  }, [isAlwaysConsent, todayStr]);

  const isDateTooSoon = isConsentRequired && date && date < (() => {
    const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString().split('T')[0];
  })();

  const isToday = date === todayStr;
  const nowHour = today.getHours();
  const nowMin = today.getMinutes();
  const isTimePast = (h, m) => {
    if (!isToday) return false;
    return h < nowHour || (h === nowHour && m <= nowMin);
  };

  const isOverCapacity = !!(facility.capacity && attendees > facility.capacity);
  const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  const checkConflict = () => {
    if (!startTime || !endTime) return false;
    return bookings.some(b => {
      if (b.facility_id !== facility.id || b.date !== date || b.status === 'declined' || b.status === 'cancelled') return false;
      const buf = 30;
      return (toMins(startTime) >= toMins(b.start_time) - buf && toMins(startTime) < toMins(b.end_time) + buf) ||
             (toMins(endTime) > toMins(b.start_time) - buf && toMins(endTime) <= toMins(b.end_time) + buf) ||
             (toMins(startTime) <= toMins(b.start_time) - buf && toMins(endTime) >= toMins(b.end_time) + buf);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConflictError('');

    if (!user && (!guestEmail || !guestName)) {
      toast.error('Guest details missing'); return;
    }
    if (startTime >= endTime) { setConflictError('End time must be after start time.'); return; }
    if (startTime < '08:00' || endTime > '20:00') { setConflictError('Bookings must be between 8:00 AM and 8:00 PM.'); return; }
    if (isOverCapacity) { setConflictError(`Capacity exceeded. Max ${facility.capacity} people.`); return; }
    if (blackoutDates?.some(bd => bd.date === date)) {
      setConflictError('This date is blocked for maintenance. Please choose another date.'); return;
    }
    if (isDateTooSoon) {
      setConflictError('This facility requires a 3-day lead time for consent bookings.'); return;
    }
    if (isConsentRequired && !file) { setConflictError('A consent letter upload is mandatory.'); return; }
    if (checkConflict()) { setConflictError('Time slot overlaps with an existing booking (30-min buffer included).'); return; }

    setIsSubmitting(true);
    
    // Construct database strings
    let finalNotes = `Event: ${eventName} | Dept: ${department} | Desig: ${designation}\nPurpose: ${notes}`;
    if (facilitator.trim()) finalNotes += ` | Facilitator: ${facilitator.trim()}`;
    if (facility.id === 'iot') finalNotes += `\n(Assigned Personnel: ${iotPersonnel})`;
    if (needsManpower) finalNotes += '\n[Requested TDEVS manpower]';

    // Submit payload directly through standard Inertia Pipeline
    router.post('/bookings', {
      facility_id: facility.id,
      date,
      start_time: startTime,
      end_time: endTime,
      notes: finalNotes,
      attendees,
      guest_name: user ? null : guestName,
      guest_email: user ? null : guestEmail,
      guest_phone: user ? null : guestPhone,
      needs_manpower: needsManpower,
      consent_letter: file // File uploads handled automatically by Inertia Multipart forms
    }, {
      onSuccess: () => {
        setIsSubmitting(false);
        setSuccess(true);
        toast.success('Booking Request Submitted Successfully!');
        setTimeout(() => { onClose(); router.visit('/dashboard'); }, 1800);
      },
      onError: (errors) => {
        setIsSubmitting(false);
        setConflictError(Object.values(errors)[0] || 'An error occurred during verification.');
      }
    });
  };

  if (success) {
    return (
      <div className="text-center py-10 px-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Request Submitted</h3>
        <p className="text-sm text-gray-500">The facility admin has been notified.</p>
        <p className="text-xs text-gray-400 mt-2">Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* ── Applicant Info ─────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Applicant Information</h4>
        {user ? (
          <div className="bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-indigo-800">
                {user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-indigo-900">{user.name}</p>
              <p className="text-xs text-indigo-500">{user.email}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><UserIcon className="h-4 w-4 text-gray-400" /></div>
              <input type="text" required placeholder="Full Name" value={guestName} onChange={e => setGuestName(e.target.value)}
                className="pl-10 block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
            </div>
            <input type="email" required placeholder="Email address" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
              className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
            <input type="tel" required placeholder="Phone number" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
              className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
          </div>
        )}
      </div>

      {/* ── Event Details ──────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-gray-100 space-y-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Event Details</h4>
        <input type="text" required placeholder="Event name / title" value={eventName} onChange={e => setEventName(e.target.value)}
          className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
        <div className="grid grid-cols-2 gap-3">
          <input type="text" required placeholder="Department / Org" value={department} onChange={e => setDepartment(e.target.value)}
            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
          <input type="text" required placeholder="Designation" value={designation} onChange={e => setDesignation(e.target.value)}
            className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
        </div>
        <input type="text" placeholder="Facilitator (optional)" value={facilitator} onChange={e => setFacilitator(e.target.value)}
          className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400" />
        <textarea required rows={2} placeholder="Purpose of the event…" value={notes} onChange={e => setNotes(e.target.value)}
          className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400 resize-none" />
      </div>

      {/* ── Schedule ───────────────────────────────────────────── */}
      <div className="px-6 py-5 border-b border-gray-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule</h4>
          {isConsentRequired && (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              3-day lead time required
            </span>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><CalendarIcon className="h-4 w-4 text-gray-400" /></div>
          <input type="date" required value={date} min={minDate}
            onChange={e => {
              const selectedDate = e.target.value;
              if (blackoutDates?.some(bd => bd.date === selectedDate)) {
                setDate('');
                setConflictError('This date is blocked for maintenance.');
                return;
              }
              setDate(selectedDate);
              setStartTime('');
              setEndTime('');
              setConflictError('');
            }}
            className={`pl-10 block w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400 ${isDateTooSoon ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
        </div>

        {isDateTooSoon && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">Consent-required bookings need 3 days advance notice. Earliest: {minDate}</p>
          </div>
        )}

        {isWeekendBooking && !isAlwaysConsent && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700"><strong>Weekend booking.</strong> A signed consent letter is now required.</p>
          </div>
        )}

        {/* Time select grids */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
            <select required value={startTime} onChange={e => setStartTime(e.target.value)}
              className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400">
              <option value="">Select time</option>
              {Array.from({ length: 24 }).map((_, i) => {
                const hour = Math.floor(i / 2) + 8;
                const min = i % 2 === 0 ? 0 : 30;
                if (hour > 19 || (hour === 19 && min === 30)) return null;
                const val = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                const past = isTimePast(hour, min);
                return (
                  <option key={val} value={val} disabled={past}>
                    {`${hour % 12 || 12}:${min.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
            <select required value={endTime} onChange={e => setEndTime(e.target.value)}
              className="block w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400">
              <option value="">Select time</option>
              {Array.from({ length: 25 }).map((_, i) => {
                const hour = Math.floor(i / 2) + 8;
                const min = i % 2 === 0 ? 0 : 30;
                if (hour > 20 || (hour === 8 && min === 0)) return null;
                const val = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
                const tooEarly = startTime && toMins(val) <= toMins(startTime);
                return (
                  <option key={val} value={val} disabled={!!tooEarly}>
                    {`${hour % 12 || 12}:${min.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Attendees Count</label>
          <input type="number" min={1} required value={attendees} onChange={e => setAttendees(Number(e.target.value))}
            className={`block w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-400 ${isOverCapacity ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
          {isOverCapacity && <p className="mt-1 text-xs text-red-600">Exceeds limits of {facility.capacity} seats.</p>}
        </div>

        {/* Manpower */}
        {facility.allowTdevsManpower && (
          <label className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200 cursor-pointer">
            <input type="checkbox" checked={needsManpower} onChange={e => setNeedsManpower(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Request TDEVS Manpower</p>
              <p className="text-xs text-amber-700 mt-1">Opting for Manpower incurs a ₱100 service charge.</p>
            </div>
          </label>
        )}
      </div>

      {/* ── Consent Letter Upload ───────────────────────────────────── */}
      {isConsentRequired && (
        <div className="px-6 py-5 border-b border-gray-100 space-y-3">
          <div className="relative border-2 border-dashed rounded-xl p-4 bg-gray-50 hover:bg-indigo-50/40 border-gray-200">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-semibold text-gray-600">{file ? file.name : 'Click to attach Consent Form'}</p>
                <p className="text-xs text-gray-400">PDF, DOC up to 5MB</p>
              </div>
            </div>
            <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
        </div>
      )}

      <div className="px-6 py-5 space-y-3">
        {conflictError && <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{conflictError}</div>}
        <button type="submit" disabled={isSubmitting || isOverCapacity || !!isDateTooSoon}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:bg-indigo-300">
          {isSubmitting ? 'Submitting…' : 'Submit Booking Request'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Primary Export View Component
// ─────────────────────────────────────────────────────────────────────────────
export default function FacilityDetails({ facility, blackoutDates, bookings, availablePersonnel }) {
  const [bookingOpen, setBookingOpen] = useState(false);

  if (!facility) {
    return (
      <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Not Found</h2>}>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Facility not found</h2>
        </div>
      </AuthenticatedLayout>
    );
  }

  const isAlwaysConsent = facility.requirement === 'CONSENT_REQUIRED';

  return (
    <AuthenticatedLayout header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{facility.name} Details</h2>}>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <button onClick={() => window.history.back()} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-6 group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to facilities
        </button>

        {/* Hero Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="h-64 sm:h-80 w-full relative">
            <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="inline-block px-3 py-1 mb-2 rounded-full text-xs font-bold bg-indigo-500/90 backdrop-blur-md uppercase">
                {facility.type}
              </span>
              <h1 className="text-3xl font-bold">{facility.name}</h1>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">About this facility</h2>
                <p className="text-gray-600 leading-relaxed">{facility.description}</p>

                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><MapPin className="h-4 w-4 text-gray-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Location</p>
                      <p className="text-sm font-semibold text-gray-800">{facility.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg"><Users className="h-4 w-4 text-gray-500" /></div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Capacity</p>
                      <p className="text-sm font-semibold text-gray-800">{facility.capacity ? `${facility.capacity} people` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button onClick={() => setBookingOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors">
                  <CalendarIcon className="h-4 w-4" /> Book this facility
                </button>
              </div>
            </div>

            {/* Facility Admins */}
            {facility.facility_admins?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-indigo-400" /> Facility Admins</h3>
                <div className="flex flex-wrap gap-2">
                  {facility.facility_admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5">
                      <div>
                        <p className="text-xs font-bold text-indigo-900 leading-tight">{admin.name}</p>
                        <p className="text-[10px] text-indigo-400">{admin.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Dialog Modal Container */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBookingOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h2 className="font-bold text-gray-900">Book {facility.name}</h2>
              </div>
              <button onClick={() => setBookingOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <BookingModal facility={facility} blackoutDates={blackoutDates} bookings={bookings} availablePersonnel={availablePersonnel} onClose={() => setBookingOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  );
}

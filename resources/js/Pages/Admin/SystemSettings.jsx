import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Settings, ShieldAlert, Sliders, Hourglass, Trash2 } from 'lucide-react';

export default function SystemSettings({ settings }) {
    // Current state handles
    const [approvalScope, setApprovalScope] = useState(settings.auto_approve_scope || 'disabled');
    const [fee, setFee] = useState(settings.overtime_fee_per_hour || 0);
    const [cleanupBuffer, setCleanupBuffer] = useState(settings.cleanup_buffer_minutes || 30);
    const [maxAdvanceDays, setMaxAdvanceDays] = useState(settings.max_advance_days || 30);
    const [maxBookingDuration, setMaxBookingDuration] = useState(settings.max_booking_duration || 4);
    const [requireConsent, setRequireConsent] = useState(settings.require_consent_letter || false);
    const [autoPurgeDays, setAutoPurgeDays] = useState(settings.auto_purge_unapproved_days || 0);
    
    const [saving, setSaving] = useState(false);

    // Central saving utility passing all options to backend
    const saveSettings = (updatedPayload = {}) => {
        setSaving(true);
        
        const payload = {
            auto_approve_scope: approvalScope,
            overtime_fee_per_hour: fee,
            cleanup_buffer_minutes: cleanupBuffer,
            max_advance_days: maxAdvanceDays,
            max_booking_duration: maxBookingDuration,
            require_consent_letter: requireConsent,
            auto_purge_unapproved_days: autoPurgeDays,
            ...updatedPayload
        };

        router.patch(route('admin.settings.update'), payload, {
            preserveScroll: true,
            onFinish: () => setSaving(false)
        });
    };

    return (
        <AuthenticatedLayout header={<h1 className="text-2xl font-bold">Booking System Settings</h1>}>
            <Head title="Booking Settings" />
            
            <div className="max-w-3xl space-y-6 p-6">
                
                {/* SECTION 1: Approval Policies */}
                <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
                        <ShieldAlert className="h-5 w-5 text-[#6A535C]" />
                        <h2 className="text-lg font-bold text-slate-900">Workflow & Approval Rules</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-800">Auto-Approval Scope</label>
                            <p className="mt-1 text-xs text-slate-500">Determine whose booking requests skip the pending admin verification queues entirely.</p>
                            <select 
                                value={approvalScope}
                                onChange={(e) => {
                                    setApprovalScope(e.target.value);
                                    saveSettings({ auto_approve_scope: e.target.value });
                                }}
                                className="mt-2 block w-full rounded-xl border border-slate-200 bg-stone-50 p-3 text-sm focus:border-[#6A535C] focus:ring-1 focus:ring-[#6A535C]"
                            >
                                <option value="disabled">Disabled (All bookings require manual review)</option>
                                <option value="superadmin_only">Superadmins Only (Instant pass for Superadmins only)</option>
                                <option value="everyone">Everyone (All system reservations auto-approve instantly)</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between border-t border-stone-50 pt-6">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Mandate Consent Letters</h3>
                                <p className="mt-1 text-xs text-slate-500">Require forms or booking clearance file attachments during form submission.</p>
                            </div>
                            <button 
                                type="button" 
                                disabled={saving} 
                                onClick={() => {
                                    const nextVal = !requireConsent;
                                    setRequireConsent(nextVal);
                                    saveSettings({ require_consent_letter: nextVal });
                                }} 
                                className={`relative h-7 w-12 rounded-full transition-colors duration-200 ease-in-out ${requireConsent ? 'bg-emerald-600' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200 ease-in-out ${requireConsent ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: Dynamic Scheduling Buffers */}
                <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
                        <Hourglass className="h-5 w-5 text-[#6A535C]" />
                        <h2 className="text-lg font-bold text-slate-900">Time Windows & Buffers</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-800">Room Cleanup Buffer (Minutes)</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="120"
                                value={cleanupBuffer} 
                                onChange={(e) => setCleanupBuffer(e.target.value)} 
                                onBlur={() => saveSettings({ cleanup_buffer_minutes: cleanupBuffer })}
                                className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#6A535C]" 
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-800">Max Booking Span (Hours)</label>
                            <input 
                                type="number" 
                                min="1" 
                                max="24"
                                value={maxBookingDuration} 
                                onChange={(e) => setMaxBookingDuration(e.target.value)} 
                                onBlur={() => saveSettings({ max_booking_duration: maxBookingDuration })}
                                className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#6A535C]" 
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-semibold text-slate-800">Max Booking Advance Window (Days)</label>
                            <p className="mt-1 text-xs text-slate-500">Restricts how early users can pick reservations out on the timeline dashboard.</p>
                            <input 
                                type="number" 
                                min="1" 
                                value={maxAdvanceDays} 
                                onChange={(e) => setMaxAdvanceDays(e.target.value)} 
                                onBlur={() => saveSettings({ max_advance_days: maxAdvanceDays })}
                                className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#6A535C]" 
                            />
                        </div>
                    </div>
                </section>

                {/* SECTION 3: Fees Management */}
                <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
                        <Sliders className="h-5 w-5 text-[#6A535C]" />
                        <h2 className="text-lg font-bold text-slate-900">Financial Policies</h2>
                    </div>

                    <label className="block text-sm font-semibold text-slate-800">Overtime Fee (Per Hour Rate)</label>
                    <div className="relative mt-2 rounded-xl shadow-sm">
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={fee} 
                            onChange={(e) => setFee(e.target.value)} 
                            onBlur={() => saveSettings({ overtime_fee_per_hour: fee })}
                            className="block w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#6A535C]" 
                        />
                    </div>
                </section>

                {/* SECTION 4: Unapproved Booking Cleanup */}
                <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-6">
                        <Trash2 className="h-5 w-5 text-[#6A535C]" />
                        <h2 className="text-lg font-bold text-slate-900">Unapproved Booking Cleanup</h2>
                    </div>

                    <label className="text-sm font-semibold text-slate-800">Auto-Purge Unapproved Bookings</label>
                    <p className="mt-1 text-xs text-slate-500">
                        Automatically delete pending bookings whose scheduled date has already passed after the selected retention period, preventing database bloat.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {[0, 7, 14].map((days) => (
                            <button
                                key={days}
                                type="button"
                                disabled={saving}
                                onClick={() => {
                                    setAutoPurgeDays(days);
                                    saveSettings({ auto_purge_unapproved_days: days });
                                }}
                                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition ${
                                    Number(autoPurgeDays) === days
                                        ? 'border-[#6A535C] bg-[#6A535C] text-white'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                }`}
                            >
                                {days === 0 ? 'Disabled' : `After ${days} days`}
                            </button>
                        ))}
                    </div>
                    {Number(autoPurgeDays) > 0 && (
                        <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            A scheduled job will run daily and permanently delete pending bookings older than {autoPurgeDays} day(s) past their scheduled date.
                        </p>
                    )}
                </section>

            </div>
        </AuthenticatedLayout>
    );
}

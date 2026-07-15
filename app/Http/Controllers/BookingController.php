<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\SystemSetting;
use Carbon\Carbon;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        // Validate everything coming from the React form
        $validated = $request->validate([
            'facility_id'     => 'required|string|exists:facilities,id',
            'date'            => 'required|date',
            'start_time'      => 'required|string',
            'end_time'        => 'required|string',
            'notes'           => 'nullable|string',
            'attendees'       => 'nullable|integer|min:1',
            'guest_name'      => 'nullable|string',
            'guest_email'     => 'nullable|email',
            'guest_phone'     => 'nullable|string',
            'needs_manpower'  => 'nullable|boolean',
            'consent_letter'  => 'nullable|file|mimes:pdf,doc,docx|max:5120',
        ]);

        $start = Carbon::createFromFormat('H:i', $validated['start_time']);
        $end = Carbon::createFromFormat('H:i', $validated['end_time']);
        if ($end->lessThanOrEqualTo($start)) return back()->withErrors(['end_time' => 'End time must be after start time.'])->withInput();
        foreach (Booking::where('facility_id', $validated['facility_id'])->whereDate('booking_date', $validated['date'])->whereIn('status', ['pending', 'approved'])->get(['start_time', 'end_time']) as $existing) {
            if ($start->lt(Carbon::createFromFormat('H:i', $existing->end_time)->addMinutes(30)) && $end->gt(Carbon::createFromFormat('H:i', $existing->start_time)->subMinutes(30))) return back()->withErrors(['start_time' => 'This room requires a 30-minute cleanup buffer from the previous booking.'])->withInput();
        }
        $settings = SystemSetting::current();

        // Handle the uploaded consent file, if one was sent
        $path = null;
        $originalName = null;

        if ($request->hasFile('consent_letter')) {
            $path = $request->file('consent_letter')->store('consent-letters', 'local');
            $originalName = $request->file('consent_letter')->getClientOriginalName();
        }

        // Create the booking record
        Booking::create([
            'facility_id'            => $validated['facility_id'],
            'user_id'                => Auth::id(), // null automatically if guest
            'guest_name'             => $validated['guest_name'] ?? null,
            'guest_email'            => $validated['guest_email'] ?? null,
            'guest_phone'            => $validated['guest_phone'] ?? null,
            'date'                   => $validated['date'],
            'booking_date'           => $validated['date'],
            'start_time'             => $validated['start_time'],
            'end_time'               => $validated['end_time'],
            'notes'                  => $validated['notes'] ?? null,
            'attendees'              => $validated['attendees'] ?? 1,
            'needs_manpower'         => $validated['needs_manpower'] ?? false,
            'consent_file_uploaded'  => $path !== null,
            'consent_file_name'      => $originalName,
            'consent_file_path'      => $path,
            'status'                 => $settings->auto_approve_bookings ? 'approved' : 'pending',
            'approved_at'            => $settings->auto_approve_bookings ? now() : null,
            'approved_by'            => $settings->auto_approve_bookings ? 'System auto-approval' : null,
        ]);

        // Redirect back — Inertia will re-render the current page with a flash message
        return redirect()->back()->with('success', 'Booking submitted successfully.');
    }

    public function decline(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:1'],
        ]);

        $booking->update([
            'status' => 'declined',
            'rejection_reason' => $validated['rejection_reason'],
            'decline_reason' => $validated['rejection_reason'],
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'error',
            'message' => 'Booking has been declined.',
        ]);
    }
}

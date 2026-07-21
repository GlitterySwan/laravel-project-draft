<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BookingController extends Controller
{
    /**
     * "My Bookings" — lists the authenticated user's own bookings, split into
     * upcoming (pending/approved, not yet passed) and history (everything
     * else: declined, cancelled, or past). Accepts optional 'search' and
     * 'status' query params, plus 'booking' to auto-open a specific booking's
     * detail modal (used when arriving from a notification click).
     */
    public function index(Request $request)
{
    $search = $request->input('search');
    $status = $request->input('status');
    $openBookingId = $request->input('booking');

    $query = Booking::with('facility')->where('user_id', Auth::id());

    if ($status) {
        $query->where('status', $status);
    }

    if ($search) {
        $query->whereHas('facility', fn ($f) => $f->where('name', 'like', "%{$search}%"));
    }

    $bookings = $query->orderByDesc('date')->get();

    $today = Carbon::today();

    $upcomingBookings = $bookings
        ->filter(fn ($b) => in_array($b->status, ['pending', 'approved']) && Carbon::parse($b->date)->gte($today))
        ->values();

    $historyBookings = $bookings
        ->reject(fn ($b) => $upcomingBookings->contains('id', $b->id))
        ->values();

    $openBooking = null;
    if ($openBookingId) {
        $openBooking = Booking::with('facility')
            ->where('user_id', Auth::id())
            ->find($openBookingId);
    }

    // ✨ 1. Fetch the activity logs for all of this user's bookings
    // Note: If your log model is named differently (e.g. BookingLog), update the class name here.
    $activityLogs = \App\Models\ActivityLog::whereIn('booking_id', $bookings->pluck('id'))
        ->orderByDesc('created_at')
        ->get();

    return Inertia::render('MyBookings', [
        'bookings' => $bookings,
        'upcomingBookings' => $upcomingBookings,
        'historyBookings' => $historyBookings,
        'filters' => $request->only(['search', 'status']),
        'openBooking' => $openBooking,
        'activityLogs' => $activityLogs, // ✨ 2. Pass it through to the frontend
    ]);
}

public function update(Request $request, string $id)
{
    $booking = Booking::where('user_id', Auth::id())->findOrFail($id);

    // Guardrail: Ensure only pending items can be changed
    if ($booking->status !== 'pending') {
        return redirect()->back()->withErrors(['status' => 'Only pending bookings can be edited.']);
    }

    // Validates against fields that ACTUALLY exist in your model schema
    $validated = $request->validate([
        'date'           => 'required|date|after_or_equal:today',
        'start_time'     => 'required',
        'end_time'       => 'required|after:start_time',
        'attendees'      => 'required|integer|min:1',
        'needs_manpower' => 'required|boolean',
        'notes'          => 'nullable|string',
    ]);

    // Mirroring the store() methodology to format target columns
    $validated['booking_date'] = $validated['date'];

    $booking->update($validated);

    return redirect()->back()->with('success', 'Booking updated successfully.');
}
    /**
     * Cancel one of the authenticated user's own bookings. Only pending or
     * approved bookings can be cancelled.
     */
    public function cancel(string $id)
    {
        $booking = Booking::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (! in_array($booking->status, ['pending', 'approved'])) {
            return redirect()->back()->with('toast', [
                'type' => 'error',
                'message' => 'This booking can no longer be cancelled.',
            ]);
        }

        $booking->update([
            'status' => 'cancelled',
        ]);

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'Booking cancelled.',
        ]);
    }

    /**
     * Store a newly created booking reservation in storage.
     */
    public function store(Request $request)
    {
        $settings = SystemSetting::current(); // Get the active settings object

        // Dynamically require the consent letter based on system configurations
        $consentRule = ($settings->require_consent_letter ?? false)
            ? 'required|file|mimes:pdf,doc,docx|max:5120'
            : 'nullable|file|mimes:pdf,doc,docx|max:5120';

        // Validate everything coming from the React form
        $validated = $request->validate([
            'facility_id'    => 'required|string|exists:facilities,id',
            'date'           => 'required|date',
            'start_time'     => 'required|string',
            'end_time'       => 'required|string',
            'notes'          => 'nullable|string',
            'attendees'      => 'nullable|integer|min:1',
            'guest_name'     => 'nullable|string',
            'guest_email'    => 'nullable|email',
            'guest_phone'    => 'nullable|string',
            'needs_manpower' => 'nullable|boolean',
            'consent_letter' => $consentRule,
        ]);

        // â±ï¸ Safe, format-flexible Carbon parsing
        $start = Carbon::parse($validated['start_time']);
        $end = Carbon::parse($validated['end_time']);
        $bookingDate = Carbon::parse($validated['date']);

        if ($end->lessThanOrEqualTo($start)) {
            return back()->withErrors(['end_time' => 'End time must be after start time.'])->withInput();
        }

        // Enforce Max Advance Days Rule
        $maxDays = $settings->max_advance_days ?? 30;
        if ($bookingDate->gt(now()->addDays($maxDays))) {
            return back()->withErrors(['date' => "You can only book facilities up to {$maxDays} days in advance."])->withInput();
        }

        // Enforce Cleanup Buffer Rule via System Setting configuration
        $buffer = $settings->cleanup_buffer_minutes ?? 30;
        
        $existingBookings = Booking::where('facility_id', $validated['facility_id'])
            ->whereDate('booking_date', $validated['date'])
            ->whereIn('status', ['pending', 'approved'])
            ->get(['start_time', 'end_time']);

        foreach ($existingBookings as $existing) {
            // ðŸ›¡ï¸ FIXED: Changed from createFromFormat to parse() to survive database time formatting ('H:i:s')
            $existingStartWithBuffer = Carbon::parse($existing->start_time)->subMinutes($buffer);
            $existingEndWithBuffer = Carbon::parse($existing->end_time)->addMinutes($buffer);

            if ($start->lt($existingEndWithBuffer) && $end->gt($existingStartWithBuffer)) {
                return back()->withErrors(['start_time' => "This room requires a {$buffer}-minute cleanup buffer from neighboring bookings."])->withInput();
            }
        }

        // Smart Auto-Approval Check
        $isSuperAdmin = Auth::check() && Auth::user()->role === 'super_admin';
        $approvalScope = $settings->auto_approve_scope ?? 'disabled';

        $autoApprove = false;
        if ($approvalScope === 'everyone') {
            $autoApprove = true;
        } elseif ($approvalScope === 'superadmin_only' && $isSuperAdmin) {
            $autoApprove = true;
        }

        // Handle the uploaded consent file, if one was sent
        $path = null;
        $originalName = null;

        if ($request->hasFile('consent_letter')) {
            $path = $request->file('consent_letter')->store('consent-letters', 'local');
            $originalName = $request->file('consent_letter')->getClientOriginalName();
        }

        // Create and capture the booking record
        $booking = Booking::create([
            'facility_id'           => $validated['facility_id'],
            'user_id'               => Auth::id(), 
            'guest_name'            => $validated['guest_name'] ?? null,
            'guest_email'           => $validated['guest_email'] ?? null,
            'guest_phone'           => $validated['guest_phone'] ?? null,
            'date'                  => $validated['date'],
            'booking_date'          => $validated['date'],
            'start_time'            => $start->format('H:i'),
            'end_time'              => $end->format('H:i'),
            'notes'                 => $validated['notes'] ?? null,
            'attendees'             => $validated['attendees'] ?? 1,
            'needs_manpower'        => $validated['needs_manpower'] ?? false,
            'consent_file_uploaded' => $path !== null,
            'consent_file_name'     => $originalName,
            'consent_file_path'     => $path,
            'status'                => $autoApprove ? 'approved' : 'pending',
            'approved_at'           => $autoApprove ? now() : null,
            'approved_by'           => $autoApprove ? ($isSuperAdmin ? 'Superadmin Instant Pass' : 'System Auto-Approval Policies') : null,
        ]);

        // ðŸ“¡ Protected event dispatching to eliminate pipeline breakages
        try {
            broadcast(new \App\Events\BookingCreatedEvent($booking))->toOthers();
        } catch (\Exception $e) {
            Log::warning("WebSocket Broadcast failed: " . $e->getMessage());
        }

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'Booking submitted successfully.',
        ]);
    }
}
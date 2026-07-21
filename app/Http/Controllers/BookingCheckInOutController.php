<?php
namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingCheckInOutController extends Controller
{
    /**
     * Mark a booking as checked in (active).
     */
    public function checkIn(Request $request, Booking $booking)
    {
        abort_if($booking->status !== 'approved', 403, 'Only approved bookings can be checked in.');
        abort_if($booking->checked_in_at, 422, 'This booking is already checked in.');

        $booking->update(['checked_in_at' => now()]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Booking #{$booking->id} marked as checked in.",
        ]);
    }

    /**
     * Mark a booking as checked out (completed).
     */
    public function checkOut(Request $request, Booking $booking)
    {
        abort_if(!$booking->checked_in_at, 422, 'This booking has not been checked in yet.');
        abort_if($booking->checked_out_at, 422, 'This booking is already checked out.');

        $booking->update(['checked_out_at' => now()]);

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Booking #{$booking->id} marked as checked out.",
        ]);
    }

    /**
     * Return active bookings with overtime information for admin dashboards.
     */
    public function activeBookings()
    {
        $now = Carbon::now();
        $settings = SystemSetting::current();
        $feePerHour = $settings->overtime_fee_per_hour ?? 0;

        $activeBookings = Booking::with(['facility:id,name', 'user:id,name,email'])
            ->where('status', 'approved')
            ->whereNotNull('checked_in_at')
            ->whereNull('checked_out_at')
            ->whereDate('date', '<=', $now->toDateString())
            ->get()
            ->map(function ($booking) use ($now, $feePerHour) {
                $endDateTime = Carbon::parse($booking->date . ' ' . $booking->end_time);
                $isOvertime = $now->greaterThan($endDateTime);
                $overtimeMinutes = $isOvertime ? $endDateTime->diffInMinutes($now) : 0;
                $overtimeHours = $overtimeMinutes / 60;
                $overtimeFee = round($overtimeHours * $feePerHour, 2);

                return [
                    'id' => $booking->id,
                    'facility_name' => $booking->facility?->name ?? 'N/A',
                    'user_name' => $booking->user?->name ?? $booking->guest_name ?? 'Guest',
                    'user_email' => $booking->user?->email ?? $booking->guest_email ?? '',
                    'date' => $booking->date,
                    'start_time' => $booking->start_time,
                    'end_time' => $booking->end_time,
                    'checked_in_at' => $booking->checked_in_at,
                    'is_overtime' => $isOvertime,
                    'overtime_minutes' => (int) $overtimeMinutes,
                    'overtime_fee' => $overtimeFee,
                    'overtime_fee_per_hour' => $feePerHour,
                    'status' => $booking->status,
                ];
            });

        return response()->json(['activeBookings' => $activeBookings]);
    }
}
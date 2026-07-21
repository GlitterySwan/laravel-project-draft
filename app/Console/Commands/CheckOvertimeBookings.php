<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\User;
use App\Models\SystemSetting;
use App\Notifications\BookingOperationsNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckOvertimeBookings extends Command
{
    protected $signature = 'bookings:check-overtime';
    protected $description = 'Check for active bookings that have exceeded their scheduled end time and trigger overtime notifications.';

    public function handle()
    {
        $now = Carbon::now();
        
        // Find approved bookings that have checked in, but haven't checked out,
        // whose end_time has passed, and haven't been notified yet
        $overdueBookings = Booking::with('facility', 'user')
            ->where('status', 'approved')
            ->whereNotNull('checked_in_at')
            ->whereNull('checked_out_at')
            ->whereNull('overtime_notified_at')
            ->where('date', '<=', $now->toDateString())
            ->get()
            ->filter(function ($booking) use ($now) {
                $endDateTime = Carbon::parse($booking->date . ' ' . $booking->end_time);
                return $now->greaterThan($endDateTime);
            });

        $count = 0;
        
        foreach ($overdueBookings as $booking) {
            $facilityName = $booking->facility?->name ?? 'Unknown Facility';
            $message = "Overtime Infraction: {$facilityName} has exceeded its booked schedule.";
            
            // Notify all super admins and facility admins
            User::whereIn('role', ['super_admin', 'facility_admin'])
                ->each(fn (User $user) => $user->notify(
                    new BookingOperationsNotification($message, $booking->id)
                ));

            // Mark as notified so we don't spam
            $booking->update(['overtime_notified_at' => $now]);

            $count++;
        }

        $this->info("Checked {$count} overtime booking(s). Notifications sent.");
        
        return Command::SUCCESS;
    }
}
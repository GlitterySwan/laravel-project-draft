<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\SystemSetting;
use Carbon\Carbon;
use Illuminate\Console\Command;

class PurgeUnapprovedBookings extends Command
{
    protected $signature = 'bookings:purge-unapproved';
    protected $description = 'Automatically purge unapproved (pending) bookings whose scheduled date has passed the configured retention period.';

    public function handle()
    {
        $retentionDays = (int) SystemSetting::current()->auto_purge_unapproved_days;

        // If the feature is disabled (0), do nothing
        if ($retentionDays <= 0) {
            $this->info('Auto-purge is disabled. Set auto_purge_unapproved_days to 7 or 14 in Booking System Settings.');
            return Command::SUCCESS;
        }

        $cutoff = Carbon::now()->subDays($retentionDays)->toDateString();

        $expiredUnapproved = Booking::where('status', 'pending')
            ->where(function ($q) use ($cutoff) {
                $q->whereDate('booking_date', '<', $cutoff)
                  ->orWhereDate('date', '<', $cutoff);
            });

        $count = (clone $expiredUnapproved)->count();

        if ($count > 0) {
            // Hard delete to prevent DB bloat
            (clone $expiredUnapproved)->delete();
            $this->info("Purged {$count} expired unapproved booking(s) older than {$retentionDays} day(s).");
        } else {
            $this->info('No expired unapproved bookings found to purge.');
        }

        return Command::SUCCESS;
    }
}
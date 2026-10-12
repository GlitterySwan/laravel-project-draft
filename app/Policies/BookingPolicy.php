<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $this->canAccessBooking($user, $booking);
    }

    public function approve(User $user, Booking $booking): bool
    {
        return $this->canAccessBooking($user, $booking);
    }

    public function decline(User $user, Booking $booking): bool
    {
        return $this->canAccessBooking($user, $booking);
    }

    public function delete(User $user, Booking $booking): bool
    {
        return $this->canAccessBooking($user, $booking);
    }

    private function canAccessBooking(User $user, Booking $booking): bool
    {
        if ($user->role === 'super_admin') {
            return true;
        }

        if ($user->role !== 'facility_admin') {
            return false;
        }

        return $booking->facility()->whereHas('facilityAdmins', function ($query) use ($user) {
            $query->where('users.id', $user->getKey());
        })->exists();
    }
}

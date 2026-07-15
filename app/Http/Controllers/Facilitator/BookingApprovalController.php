<?php

namespace App\Http\Controllers\Facilitator;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BookingApprovalController extends Controller
{
    /**
     * List all bookings for facilitator review (pending first, then history).
     */
    public function index(): Response
    {
        $query = $this->getVisibleBookingsQuery(Auth::user());

        return Inertia::render('Facilitator/Bookings', [
            'pendingBookings' => (clone $query)
                ->where('status', 'pending')
                ->orderBy('date')
                ->get(),
            'reviewedBookings' => (clone $query)
                ->whereIn('status', ['approved', 'declined'])
                ->orderByDesc('updated_at')
                ->limit(20)
                ->get(),
        ]);
    }

    public function getVisibleBookingsQuery(?User $user = null)
    {
        $query = Booking::with('facility', 'user');
        $user ??= Auth::user();

        if ($user->role === 'facility_admin') {
            $query->whereHas('facility', function ($facilityQuery) use ($user) {
                $facilityQuery->whereHas('facilityAdmins', function ($adminQuery) use ($user) {
                    $adminQuery->where('users.id', $user->id);
                });
            });
        }

        return $query;
    }

    /**
     * Approve a booking.
     */
    public function approve(Booking $booking)
    {
        $user = Auth::user();

        if ($user->role === 'facility_admin' && !$booking->facility->facilityAdmins()->whereKey($user->id)->exists()) {
            abort(403);
        }

        $booking->update([
            'status' => 'approved',
            'approved_by' => $user->name,
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Booking approved.');
    }

    /**
     * Decline a booking.
     */
    public function decline(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:1'],
        ]);
        $user = Auth::user();

        if ($user->role === 'facility_admin' && !$booking->facility->facilityAdmins()->whereKey($user->id)->exists()) {
            abort(403);
        }

        $booking->update([
            'status' => 'declined',
            'approved_by' => $user->name,
            'approved_at' => now(),
            'decline_reason' => $validated['rejection_reason'],
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return redirect()->back()->with('toast', ['type' => 'error', 'message' => 'Booking has been declined.']);
    }
}

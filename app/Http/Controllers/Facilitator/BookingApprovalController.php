<?php

namespace App\Http\Controllers\Facilitator;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingOperationsNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BookingApprovalController extends Controller
{
    /**
     * List all bookings for facilitator review (pending first, then history).
     * Accepts optional search & status query params for debounced filtering.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = $this->getVisibleBookingsQuery(Auth::user());

        // 1. Initialize base queries
        $pendingQuery = (clone $query)->where('status', 'pending');
        $reviewedQuery = (clone $query)->whereIn('status', ['approved', 'declined']);

        // 🎛️ Connect Status Dropdown Filter to the Database
        if ($status) {
            if ($status === 'pending') {
                // If filtering for pending, clear out the reviewed history section completely
                $reviewedQuery->where('id', 0);
            } elseif (in_array($status, ['approved', 'declined'])) {
                // If filtering for approved/declined, clear the pending cards and filter the table
                $pendingQuery->where('id', 0);
                $reviewedQuery->where('status', $status);
            }
        }

        // 🔍 Apply Search Filter to both active datasets (Cards and History Table)
        if ($search) {
            $searchFilter = function ($q) use ($search) {
                $q->whereHas('facility', fn ($f) => $f->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhere('guest_name', 'like', "%{$search}%");
            };

            $pendingQuery->where($searchFilter);
            $reviewedQuery->where($searchFilter);
        }

        return Inertia::render('Facilitator/Bookings', [
            'pendingBookings' => $pendingQuery->orderBy('date')->get(),
            'reviewedBookings' => $reviewedQuery->orderByDesc('updated_at')->limit(20)->get(),
            'filters' => $request->only(['search', 'status']),
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

        // Notify the user who made the booking
        if ($booking->user_id) {
            $bookingUser = User::find($booking->user_id);
            if ($bookingUser) {
                $facilityName = $booking->facility?->name ?? 'A facility';
                $bookingUser->notify(
                    new BookingOperationsNotification(
                        "Your booking at {$facilityName} on {$booking->date} ({$booking->start_time}–{$booking->end_time}) has been approved.",
                        $booking->id
                    )
                );
            }
        }

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

        // Notify the user who made the booking
        if ($booking->user_id) {
            $bookingUser = User::find($booking->user_id);
            if ($bookingUser) {
                $facilityName = $booking->facility?->name ?? 'A facility';
                $bookingUser->notify(
                    new BookingOperationsNotification(
                        "Your booking at {$facilityName} on {$booking->date} ({$booking->start_time}–{$booking->end_time}) has been declined. Reason: {$validated['rejection_reason']}",
                        $booking->id
                    )
                );
            }
        }

        return redirect()->back()->with('toast', ['type' => 'error', 'message' => 'Booking has been declined.']);
    }
}
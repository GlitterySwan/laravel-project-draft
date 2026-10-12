<?php

namespace App\Http\Controllers\Facilitator;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingOperationsNotification;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BookingApprovalController extends Controller
{
    use AuthorizesRequests;
    /**
     * List all bookings for facilitator review (pending first, then history).
     * Accepts optional search & status query params for debounced filtering.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = $this->getVisibleBookingsQuery(Auth::user());

        $today = now()->toDateString();

        // 1. Initialize base queries
        // Pending bookings EXCLUDE past-dated ones so they don't clutter the actionable view
        $pendingQuery = (clone $query)
            ->where('status', 'pending')
            ->where(function ($q) use ($today) {
                $q->whereDate('booking_date', '>=', $today)
                  ->orWhereDate('date', '>=', $today);
            });

        $reviewedQuery = (clone $query)->whereIn('status', ['approved', 'declined']);

        // Past unapproved = pending bookings whose scheduled date has already passed
        $pastUnapprovedQuery = (clone $query)
            ->where('status', 'pending')
            ->where(function ($q) use ($today) {
                $q->whereDate('booking_date', '<', $today)
                  ->orWhereDate('date', '<', $today);
            });

        // 🎛️ Connect Status Dropdown Filter to the Database
        if ($status) {
            if ($status === 'pending') {
                // If filtering for pending, clear out the reviewed history section completely
                $reviewedQuery->where('id', 0);
                $pastUnapprovedQuery->where('id', 0);
            } elseif ($status === 'past_unapproved') {
                // Show only past unapproved bookings
                $pendingQuery->where('id', 0);
                $reviewedQuery->where('id', 0);
            } elseif (in_array($status, ['approved', 'declined'])) {
                // If filtering for approved/declined, clear the pending cards and filter the table
                $pendingQuery->where('id', 0);
                $pastUnapprovedQuery->where('id', 0);
                $reviewedQuery->where('status', $status);
            }
        }

        // 🔍 Apply Search Filter to all active datasets (Cards, History Table, Past Unapproved)
        if ($search) {
            $searchFilter = function ($q) use ($search) {
                $q->whereHas('facility', fn ($f) => $f->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhere('guest_name', 'like', "%{$search}%");
            };

            $pendingQuery->where($searchFilter);
            $reviewedQuery->where($searchFilter);
            $pastUnapprovedQuery->where($searchFilter);
        }

        return Inertia::render('Facilitator/Bookings', [
            'pendingBookings' => $pendingQuery->orderBy('date')->get(),
            'reviewedBookings' => $reviewedQuery->orderByDesc('updated_at')->limit(20)->get(),
            'pastUnapprovedBookings' => $pastUnapprovedQuery->orderByDesc('date')->get(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function getVisibleBookingsQuery(?User $user = null)
    {
        $user ??= Auth::user();

        return Booking::query()->forUser($user)->with('facility', 'user');
    }

    /**
     * Approve a booking.
     */
    public function approve(Booking $booking)
    {
        $user = Auth::user();
        $this->authorize('approve', $booking);

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
        $this->authorize('decline', $booking);

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

    /**
     * Delete a single past unapproved booking (manual cleanup).
     */
    public function destroy(Booking $booking)
    {
        $user = Auth::user();
        $this->authorize('delete', $booking);

        // Only allow deletion of past unapproved bookings
        $today = now()->toDateString();
        $isPast = ($booking->booking_date && $booking->booking_date->lt($today))
            || ($booking->date && $booking->date->lt($today));

        if ($booking->status !== 'pending' || !$isPast) {
            return redirect()->back()->with('toast', [
                'type' => 'error',
                'message' => 'Only past unapproved bookings can be deleted.',
            ]);
        }

        $booking->delete();

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'Past unapproved booking deleted.',
        ]);
    }

    /**
     * Delete ALL past unapproved bookings (manual bulk cleanup).
     */
    public function destroyAll()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $query = $this->getVisibleBookingsQuery($user)
            ->where('status', 'pending')
            ->where(function ($q) use ($today) {
                $q->whereDate('booking_date', '<', $today)
                  ->orWhereDate('date', '<', $today);
            });

        $count = (clone $query)->count();

        if ($count > 0) {
            (clone $query)->delete();
        }

        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => "Deleted {$count} past unapproved booking(s).",
        ]);
    }
}
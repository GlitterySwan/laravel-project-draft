<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\UserConcern;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $user = Auth::user();

        $bookingQuery = Booking::with(['facility:id,name', 'user:id,name,email'])->forUser($user);

        $bookings = (clone $bookingQuery)
            ->where('booking_date', '>=', now()->subMonths(5)->startOfMonth())
            ->get();

        $usageOverTime = collect(range(5, 0))->map(function (int $monthsAgo) use ($bookings) {
            $month = now()->subMonths($monthsAgo)->startOfMonth();
            return [
                'label' => $month->format('M Y'),
                'bookings' => $bookings->filter(fn (Booking $booking) => $booking->booking_date?->isSameMonth($month))->count(),
                'approved' => $bookings->filter(fn (Booking $booking) => $booking->booking_date?->isSameMonth($month) && $booking->status === 'approved')->count(),
            ];
        })->values();

        $mostUsedFacilities = $bookings->groupBy('facility_id')->map(function ($facilityBookings) {
            return [
                'name' => $facilityBookings->first()->facility?->name ?? 'Deleted facility',
                'bookings' => $facilityBookings->count(),
                'approved' => $facilityBookings->where('status', 'approved')->count(),
            ];
        })->sortByDesc('bookings')->take(5)->values();

        // Scope counts to the authenticated user (super_admin sees all, facility_admin sees assigned only)
        $totalBookings = (clone $bookingQuery)->count();
        $pendingApprovals = (clone $bookingQuery)->where('status', 'pending')->count();
        $approvedBookings = (clone $bookingQuery)->where('status', 'approved')->count();
        $declinedBookings = (clone $bookingQuery)->where('status', 'declined')->count();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalFacilities' => Facility::count(),
                'totalBookings' => $totalBookings,
                'pendingApprovals' => $pendingApprovals,
                'pendingConcerns' => UserConcern::where('status', 'pending')->count(),
                'approvedBookings' => $approvedBookings,
                'declinedBookings' => $declinedBookings,
            ],
            'usageOverTime' => $usageOverTime,
            'mostUsedFacilities' => $mostUsedFacilities,
            // Show ALL pending bookings (no take() limit) so new requests always appear
            'pendingBookings' => (clone $bookingQuery)
                ->where('status', 'pending')
                ->orderBy('booking_date')
                ->orderBy('start_time')
                ->get(),
            'recentConcerns' => UserConcern::with('user:id,name,email')->latest()->take(6)->get(),
        ]);
    }
}
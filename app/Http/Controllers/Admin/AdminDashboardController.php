<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\UserConcern;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        $bookings = Booking::with('facility:id,name')
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

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalFacilities' => Facility::count(),
                'totalBookings' => Booking::count(),
                'pendingApprovals' => Booking::where('status', 'pending')->count(),
                'pendingConcerns' => UserConcern::where('status', 'pending')->count(),
                'approvedBookings' => Booking::where('status', 'approved')->count(),
                'declinedBookings' => Booking::where('status', 'declined')->count(),
            ],
            'usageOverTime' => $usageOverTime,
            'mostUsedFacilities' => $mostUsedFacilities,
            'pendingBookings' => Booking::with(['facility:id,name', 'user:id,name,email'])
                ->where('status', 'pending')->orderBy('booking_date')->take(6)->get(),
            'recentConcerns' => UserConcern::with('user:id,name,email')->latest()->take(6)->get(),
        ]);
    }
}

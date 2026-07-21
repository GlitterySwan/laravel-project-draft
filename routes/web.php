<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\DeveloperContactController;
use App\Http\Controllers\UserConcernController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\FacilityManagementController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\ConcernManagementController;
use App\Http\Controllers\Admin\SystemSettingsController;
use App\Http\Controllers\BookingCheckInController;
use App\Http\Controllers\BookingCheckInOutController;
use App\Http\Controllers\Facilitator\BookingApprovalController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Models\Facility;
use App\Models\Booking;
use App\Models\UserConcern;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// 1. Welcome Page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// 2. Authenticated Dashboard & Application Space
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/force-password-change', [ForcePasswordChangeController::class, 'edit'])
        ->name('password.force.edit');

    Route::put('/force-password-change', [ForcePasswordChangeController::class, 'update'])
        ->name('password.force.update');

    Route::get('/admin-test', function () {
        return 'You are a super admin! This page is protected.';
    })->middleware('role:super_admin')->name('admin.test');

    // Central dashboard redirect — sends each role to the right place
    Route::get('/dashboard', function () {
        return match (Auth::user()->role) {
            'super_admin' => redirect()->route('admin.dashboard'),
            'facility_admin' => redirect()->route('facilitator.dashboard'),
            default => redirect()->route('user.dashboard'),
        };
    })->name('dashboard');

    // ── Super Admin Dashboard ──────────────────────────────────────────────
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])
        ->middleware('role:super_admin')->name('admin.dashboard');

    // ── Super Admin Bookings Management ────────────────────────────────────
    Route::get('/admin/bookings', [BookingApprovalController::class, 'index'])
        ->middleware('role:super_admin')
        ->name('admin.bookings.index');

    // ── Super Admin Booking Management Updates ─────────────────────────────
    Route::patch('/admin/bookings/{booking}/approve', [BookingApprovalController::class, 'approve'])
        ->middleware('role:super_admin')
        ->name('admin.bookings.approve');

    Route::patch('/admin/bookings/{booking}/decline', [BookingApprovalController::class, 'decline'])
        ->middleware('role:super_admin')
        ->name('admin.bookings.decline');

    // ── Facilitator Bookings (facility_admin only) ─────────────────────────
    Route::get('/facilitator/bookings', [BookingApprovalController::class, 'index'])
        ->middleware('role:facility_admin')
        ->name('facilitator.bookings.index');

    Route::patch('/facilitator/bookings/{booking}/approve', [BookingApprovalController::class, 'approve'])
        ->middleware('role:facility_admin')
        ->name('facilitator.bookings.approve');

    Route::patch('/facilitator/bookings/{booking}/decline', [BookingApprovalController::class, 'decline'])
        ->middleware('role:facility_admin')
        ->name('facilitator.bookings.decline');

    // Active Bookings Monitor Page (Inertia page, distinct URL from JSON endpoint)
    Route::get('/admin/active-bookings-monitor', function () {
        return Inertia::render('Admin/ActiveBookings');
    })->middleware('role:super_admin,facility_admin')->name('admin.active-bookings.page');

    // ── Super Admin Concerns ───────────────────────────────────────────────
    Route::get('/admin/concerns', [ConcernManagementController::class, 'index'])
        ->middleware('role:super_admin')->name('admin.concerns.index');
    Route::patch('/admin/concerns/{concern}/resolve', [ConcernManagementController::class, 'resolve'])
        ->middleware('role:super_admin')->name('admin.concerns.resolve');

    // ── Super Admin Settings ───────────────────────────────────────────────
    Route::get('/admin/settings', [SystemSettingsController::class, 'edit'])->middleware('role:super_admin')->name('admin.settings.edit');
    Route::patch('/admin/settings', [SystemSettingsController::class, 'update'])->middleware('role:super_admin')->name('admin.settings.update');

    // ── Super Admin — User Management ──────────────────────────────────────
    Route::post('/admin/users', [UserManagementController::class, 'store'])
        ->middleware('role:super_admin')->name('admin.users.store');
    Route::get('/admin/users', [UserManagementController::class, 'index'])
        ->middleware('role:super_admin')->name('admin.users.index');
    Route::patch('/admin/users/{user}/role', [UserManagementController::class, 'updateRole'])
        ->middleware('role:super_admin')->name('admin.users.updateRole');
    Route::post('/admin/users/{user}/regenerate-password', [UserManagementController::class, 'regeneratePassword'])
        ->middleware('role:super_admin')->name('admin.users.regeneratePassword');
    Route::patch('/admin/users/{user}', [UserManagementController::class, 'update'])
        ->middleware('role:super_admin')->name('admin.users.update');
    Route::patch('/admin/users/{user}/toggle-active', [UserManagementController::class, 'toggleActive'])
        ->middleware('role:super_admin')->name('admin.users.toggleActive');
    Route::delete('/admin/users/{user}', [UserManagementController::class, 'destroy'])
        ->middleware('role:super_admin')->name('admin.users.destroy');

    // ── Super Admin — Facility Management ──────────────────────────────────
    Route::get('/admin/facilities', [FacilityManagementController::class, 'index'])
        ->middleware('role:super_admin')->name('admin.facilities.index');
    Route::post('/admin/facilities', [FacilityManagementController::class, 'store'])
        ->middleware('role:super_admin')->name('admin.facilities.store');
    Route::patch('/admin/facilities/{facility}', [FacilityManagementController::class, 'update'])
        ->middleware('role:super_admin')->name('admin.facilities.update');
    Route::delete('/admin/facilities/{facility}', [FacilityManagementController::class, 'destroy'])
        ->middleware('role:super_admin')->name('admin.facilities.destroy');

    // ── Facility Admin (facilitator) dashboard ─────────────────────────────
    Route::get('/facilitator/dashboard', function () {
        $user = Auth::user();
        $pendingApprovals = Booking::where('status', 'pending');

        if ($user->role === 'facility_admin') {
            $pendingApprovals->whereHas('facility', function ($facilityQuery) use ($user) {
                $facilityQuery->whereHas('facilityAdmins', function ($adminQuery) use ($user) {
                    $adminQuery->where('users.id', $user->id);
                });
            });
        }

        // Get facilities managed by this user
        $managedFacilityIds = $user->role === 'super_admin'
            ? Facility::pluck('id')
            : Facility::whereHas('facilityAdmins', fn($q) => $q->where('users.id', $user->id))->pluck('id');

        $totalManagedFacilities = $managedFacilityIds->count();
        $approvedThisMonth = Booking::whereIn('facility_id', $managedFacilityIds)
            ->where('status', 'approved')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();

        // Unique users who booked any of the managed facilities
        $uniqueBookers = Booking::whereIn('facility_id', $managedFacilityIds)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        return Inertia::render('Facilitator/Dashboard', [
            'stats' => [
                'totalFacilities' => $totalManagedFacilities,
                'pendingApprovals' => $pendingApprovals->count(),
                'approvedThisMonth' => $approvedThisMonth,
                'uniqueBookers' => $uniqueBookers,
            ],
            'pendingBookings' => (clone $pendingApprovals)
                ->with(['facility:id,name', 'user:id,name'])
                ->orderBy('date')
                ->take(5)
                ->get(),
        ]);
    })->middleware('role:facility_admin,super_admin')->name('facilitator.dashboard');

    Route::post('/developer/contact', [DeveloperContactController::class, 'store'])
        ->name('developer.contact');

    // ── General User dashboard ─────────────────────────────────────────────
    Route::get('/user/dashboard', function () {
        return Inertia::render('User/Dashboard', [
            'stats' => [
                'totalBookings' => Booking::where('user_id', Auth::id())->count(),
                'activeRooms' => Facility::count(),
                'pendingRequests' => Booking::where('user_id', Auth::id())
                    ->where('status', 'pending')
                    ->count(),
            ],
            'upcomingBooking' => Booking::with('facility')
                ->where('user_id', Auth::id())
                ->where('date', '>=', now()->toDateString())
                ->orderBy('date', 'asc')
                ->first(),
            'recentActivities' => [
                [
                    'id' => 1,
                    'text' => 'Welcome to your new ReserveIT dashboard hub!',
                    'time' => 'Just now'
                ]
            ]
        ]);
    })->middleware('role:user')->name('user.dashboard');

    // ── Schedule Grid ──────────────────────────────────────────────────────
    Route::get('/schedule', function (\Illuminate\Http\Request $request) {
        $selectedDate = $request->validate(['date' => ['nullable', 'date']])['date'] ?? today()->toDateString();

        return Inertia::render('CalendarDashboard', [
            'selectedDate' => $selectedDate,
            'serverFacilities' => Facility::all(),
            'serverBookings' => Booking::with('user:id,name,email')
                ->whereDate('booking_date', $selectedDate)
                ->whereNotIn('status', ['declined', 'cancelled'])
                ->get(['id', 'facility_id', 'user_id', 'guest_name', 'guest_email', 'guest_phone', 'start_time', 'end_time', 'attendees', 'notes', 'status']),
        ]);
    })->name('schedule.index');

    // ── Browse Facilities ──────────────────────────────────────────────────
    Route::get('/facilities', function () {
        return Inertia::render('Facilities', [
            'facilities' => Facility::all()
        ]);
    })->name('facilities.index');

    // ── Facility Details ───────────────────────────────────────────────────
    Route::get('/facility/{id}', function ($id) {
        $facility = Facility::with('facilityAdmins:id,name,email')->findOrFail($id);

        return Inertia::render('FacilityDetails', [
            'facility' => $facility,
            'blackoutDates' => [],
            'bookings' => Booking::where('facility_id', $facility->id)
                ->whereNotIn('status', ['declined', 'cancelled'])
                ->get(['id', 'facility_id', 'date', 'start_time', 'end_time', 'status']),
            'availablePersonnel' => [],
        ]);
    })->name('facility.show');

    // ── Booking Operations ─────────────────────────────────────────────────
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');
    Route::post('/bookings/{booking}/itdif-qr-verified', [BookingCheckInController::class, 'qrVerified'])->name('bookings.itdif-qr-verified');
    Route::get('/my-bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');
    Route::put('/bookings/{id}', [BookingController::class, 'update'])->name('bookings.update');

    // ── Overtime Check-In / Check-Out ──────────────────────────────────────
    Route::post('/bookings/{booking}/check-in', [BookingCheckInOutController::class, 'checkIn'])
        ->middleware('role:facility_admin,super_admin')
        ->name('bookings.check-in');
    Route::post('/bookings/{booking}/check-out', [BookingCheckInOutController::class, 'checkOut'])
        ->middleware('role:facility_admin,super_admin')
        ->name('bookings.check-out');

    // Active bookings monitor (returns JSON for real-time dashboard usage)
    Route::get('/admin/active-bookings', [BookingCheckInOutController::class, 'activeBookings'])
        ->middleware('role:super_admin,facility_admin')
        ->name('admin.active-bookings');

    // ── Profile Settings ───────────────────────────────────────────────────
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── User Tickets ───────────────────────────────────────────────────────
    Route::get('/my-tickets', [UserConcernController::class, 'myTickets'])->name('concerns.my-tickets');

    // ── Admin reply to concerns ────────────────────────────────────────────
    Route::post('/admin/concerns/{concern}/reply', [UserConcernController::class, 'reply'])
        ->middleware('role:super_admin')
        ->name('admin.concerns.reply');

    // ── Notification: Mark all as read ─────────────────────────────────────
    Route::post('/notifications/clear', function () {
        $user = Auth::user();
        if ($user) {
            $user->unreadNotifications->markAsRead();
        }
        return redirect()->back()->with('toast', [
            'type' => 'success',
            'message' => 'Notifications cleared.',
        ]);
    })->name('notifications.clear');

    // ── Notification: Mark single notification as read ─────────────────────
    Route::post('/notifications/{notification}/read', function ($notificationId) {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user) {
            $notification = $user->notifications()->where('id', $notificationId)->firstOrFail();
            $notification->markAsRead();
        }

        return redirect()->back();
    })->name('notifications.read');

    // ── Serve consent files (authenticated, admin/facilitator only) ────────
    Route::get('/bookings/{booking}/consent', function (\App\Models\Booking $booking) {
        $user = Auth::user();
        if ($user->role === 'facility_admin') {
            $isAssigned = $booking->facility->facilityAdmins()->whereKey($user->id)->exists();
            abort_unless($isAssigned, 403);
        } elseif ($user->role !== 'super_admin') {
            abort(403);
        }

        abort_unless($booking->consent_file_uploaded && $booking->consent_file_path, 404);

        return response()->streamDownload(function () use ($booking) {
            echo \Illuminate\Support\Facades\Storage::disk('local')->get($booking->consent_file_path);
        }, $booking->consent_file_name ?? 'consent-letter.pdf', [
            'Content-Type' => 'application/pdf',
        ]);
    })->middleware('auth')->name('bookings.consent');
});

Route::post('/concerns', [UserConcernController::class, 'store'])->name('concerns.store');

require __DIR__ . '/auth.php';

Route::fallback(fn() => Inertia::render('Error/HttpError', [
    'status' => 404,
    'message' => 'We could not find the page you were looking for.',
])->toResponse(request())->setStatusCode(404));
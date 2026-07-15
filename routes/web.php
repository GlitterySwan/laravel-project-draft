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

    // Super Admin dashboard
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])
        ->middleware('role:super_admin')->name('admin.dashboard');

    Route::get('/admin/concerns', [ConcernManagementController::class, 'index'])
        ->middleware('role:super_admin')->name('admin.concerns.index');
    Route::patch('/admin/concerns/{concern}/resolve', [ConcernManagementController::class, 'resolve'])
        ->middleware('role:super_admin')->name('admin.concerns.resolve');
    Route::get('/admin/settings', [SystemSettingsController::class, 'edit'])->middleware('role:super_admin')->name('admin.settings.edit');
    Route::patch('/admin/settings', [SystemSettingsController::class, 'update'])->middleware('role:super_admin')->name('admin.settings.update');

    // Super Admin — User Management
    Route::post('/admin/users', [UserManagementController::class, 'store'])
        ->middleware('role:super_admin')
        ->name('admin.users.store');

    Route::get('/admin/users', [UserManagementController::class, 'index'])
        ->middleware('role:super_admin')
        ->name('admin.users.index');

    Route::patch('/admin/users/{user}/role', [UserManagementController::class, 'updateRole'])
        ->middleware('role:super_admin')
        ->name('admin.users.updateRole');

    Route::post('/admin/users/{user}/regenerate-password', [UserManagementController::class, 'regeneratePassword'])
        ->middleware('role:super_admin')
        ->name('admin.users.regeneratePassword');

    Route::patch('/admin/users/{user}', [UserManagementController::class, 'update'])
        ->middleware('role:super_admin')
        ->name('admin.users.update');

    Route::patch('/admin/users/{user}/toggle-active', [UserManagementController::class, 'toggleActive'])
        ->middleware('role:super_admin')
        ->name('admin.users.toggleActive');

    Route::delete('/admin/users/{user}', [UserManagementController::class, 'destroy'])
        ->middleware('role:super_admin')
        ->name('admin.users.destroy');

    // Super Admin — Facility Management
    Route::get('/admin/facilities', [FacilityManagementController::class, 'index'])
        ->middleware('role:super_admin')
        ->name('admin.facilities.index');

    Route::post('/admin/facilities', [FacilityManagementController::class, 'store'])
        ->middleware('role:super_admin')
        ->name('admin.facilities.store');

    Route::patch('/admin/facilities/{facility}', [FacilityManagementController::class, 'update'])
        ->middleware('role:super_admin')
        ->name('admin.facilities.update');

    Route::delete('/admin/facilities/{facility}', [FacilityManagementController::class, 'destroy'])
        ->middleware('role:super_admin')
        ->name('admin.facilities.destroy');

    // Facility Admin (facilitator) dashboard
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

        return Inertia::render('Facilitator/Dashboard', [
            'stats' => [
                'pendingApprovals' => $pendingApprovals->count(),
            ],
        ]);
    })->middleware('role:facility_admin,super_admin')->name('facilitator.dashboard');

    Route::get('/facilitator/bookings', [BookingApprovalController::class, 'index'])
        ->middleware('role:facility_admin,super_admin')
        ->name('facilitator.bookings.index');

    Route::patch('/facilitator/bookings/{booking}/approve', [BookingApprovalController::class, 'approve'])
        ->middleware('role:facility_admin,super_admin')
        ->name('facilitator.bookings.approve');

    Route::patch('/facilitator/bookings/{booking}/decline', [BookingApprovalController::class, 'decline'])
        ->middleware('role:facility_admin,super_admin')
        ->name('facilitator.bookings.decline');

    Route::post('/developer/contact', [DeveloperContactController::class, 'store'])
        ->name('developer.contact');

    // General User dashboard (this is your existing Dashboard.jsx content)
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

    // BRAND NEW: Dedicated Standalone Calendar Timeline Page Route
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

    // Browse Facilities Route 
    Route::get('/facilities', function () {
        return Inertia::render('Facilities', [
            'facilities' => Facility::all()
        ]);
    })->name('facilities.index');

    // Facility Details Route
    Route::get('/facility/{id}', function ($id) {
        $facility = Facility::with('facilityAdmins:id,name,email')->findOrFail($id);

        return Inertia::render('FacilityDetails', [
            'facility' => $facility,
            'blackoutDates' => [], // TODO: replace once BlackoutDate model exists
            'bookings' => Booking::where('facility_id', $facility->id)
                ->whereNotIn('status', ['declined', 'cancelled'])
                ->get(['id', 'facility_id', 'date', 'start_time', 'end_time', 'status']),
            'availablePersonnel' => [], // TODO: replace once Personnel model exists
        ]);
    })->name('facility.show');

    // Booking Controller Group Operations
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store');
    Route::post('/bookings/{booking}/itdif-qr-verified', [BookingCheckInController::class, 'qrVerified'])->name('bookings.itdif-qr-verified');
    Route::post('/bookings/{booking}/decline', [BookingController::class, 'decline'])
        ->middleware('role:facility_admin,super_admin')
        ->name('bookings.decline');
    Route::get('/my-bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::put('/bookings/{id}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel');

    // Profile Settings Customizers
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::post('/concerns', [UserConcernController::class, 'store'])->name('concerns.store');

require __DIR__ . '/auth.php';

Route::fallback(fn () => Inertia::render('Error/HttpError', [
    'status' => 404,
    'message' => 'We could not find the page you were looking for.',
])->toResponse(request())->setStatusCode(404));

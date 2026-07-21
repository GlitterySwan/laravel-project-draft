<?php
namespace App\Http\Middleware;
use Illuminate\Http\Request;
use Inertia\Middleware;
class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';
    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }
    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Only unread notifications are shared here. This is deliberate: the
        // bell dropdown is meant to show "things you haven't seen yet" — once
        // something is marked read (via Clear all or clicking a single
        // notification), it should actually disappear from the list, not just
        // lose its badge/dot.
        $notifications = [];
        if ($request->user()) {
            $notifications = $request->user()->unreadNotifications()
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($notification) {
                    $data = $notification->data;
                    return [
                        'id' => $notification->id,
                        'title' => $data['title'] ?? 'System Notification',
                        'message' => $data['message'] ?? '',
                        'booking_id' => $data['booking_id'] ?? null,
                        'read' => false,
                        'created_at' => $notification->created_at,
                    ];
                });
        }
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'toast' => fn () => $request->session()->get('toast'),
            ],
            'notifications' => $notifications,
        ];
    }
}
<?php
namespace App\Http\Controllers;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingOperationsNotification;
use Illuminate\Http\Request;
class BookingCheckInController extends Controller { public function qrVerified(Request $request, Booking $booking) { abort_unless($booking->facility_id === 'itdif', 404); abort_unless($booking->user_id === (string) $request->user()->id || $request->user()->role !== 'user', 403); abort_if($booking->is_qr_verified, 422, 'This QR verification was already submitted.'); $booking->update(['is_qr_verified'=>true, 'checked_in_at'=>now()]); $name = $booking->user?->name ?? $booking->guest_name ?? 'Guest'; $message = "ITDIF Check-In: User {$name} has verified their attendance via external QR code for Booking #{$booking->id}."; User::whereIn('role',['super_admin','facility_admin'])->each(fn (User $user) => $user->notify(new BookingOperationsNotification($message, $booking->id))); return back()->with('toast',['type'=>'success','message'=>'Facility administrators have been notified.']); } }

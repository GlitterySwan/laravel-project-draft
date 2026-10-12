<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'isSsoUser' => filled($request->user()->google_id) || blank($request->user()->password),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $verificationField = filled($user->google_id) || blank($user->password)
            ? 'typed_confirmation'
            : 'password';

        if ($verificationField === 'typed_confirmation') {
            $request->validate([
                'typed_confirmation' => ['required', 'in:DELETE'],
            ]);
        } else {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);
        }

        // Prevent the last remaining super_admin from deleting their own account,
        // which would lock the whole system out of admin functions.
        if ($user->role === 'super_admin') {
            $remainingSuperAdmins = \App\Models\User::where('role', 'super_admin')
                ->where('id', '!=', $user->id)
                ->count();

            if ($remainingSuperAdmins === 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    $verificationField => 'You are the only Super Admin. Promote another user to Super Admin before deleting your account.',
                ]);
            }
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

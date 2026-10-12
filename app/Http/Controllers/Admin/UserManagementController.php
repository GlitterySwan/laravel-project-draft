<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * List all users, for the super_admin to view and manage.
     */
    public function index(): Response
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_active', 'created_at')
            ->with('managedFacilities:id,name')
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                $user->assigned_facility_ids = $user->managedFacilities->pluck('id')->all();
                $user->assigned_facility_names = $user->managedFacilities->pluck('name')->all();

                return $user;
            });

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'facilities' => Facility::select('id', 'name')->orderBy('name')->get(),
            'newAccount' => session('newAccount'),
        ]);
    }

    /**
     * Create a new user account with an auto-generated temporary password.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'role' => ['required', Rule::in(['super_admin', 'facility_admin', 'user'])],
            'assigned_facility_ids' => 'nullable|array',
            'assigned_facility_ids.*' => 'exists:facilities,id',
        ]);

        $tempPassword = Str::password(12);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
        ]);

        if ($validated['role'] === 'facility_admin') {
            $user->managedFacilities()->sync($validated['assigned_facility_ids'] ?? []);
        }

        return redirect()->back()->with('newAccount', [
            'name' => $user->name,
            'email' => $user->email,
            'tempPassword' => $tempPassword,
        ]);
    }

    /**
     * Update a user's basic details (name, email).
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'assigned_facility_ids' => 'nullable|array',
            'assigned_facility_ids.*' => 'exists:facilities,id',
        ]);

        $user->update($validated);

        if ($user->role === 'facility_admin') {
            $user->managedFacilities()->sync($validated['assigned_facility_ids'] ?? []);
        } elseif ($user->managedFacilities()->exists()) {
            $user->managedFacilities()->detach();
        }

        return redirect()->back()->with('success', "{$user->name}'s details updated.");
    }

    /**
     * Update a single user's role.
     */
    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['super_admin', 'facility_admin', 'user'])],
            'assigned_facility_ids' => 'nullable|array',
            'assigned_facility_ids.*' => 'exists:facilities,id',
        ]);

        $this->guardLastSuperAdmin($user, fn () => $validated['role'] !== 'super_admin', 'demote');

        $user->update(['role' => $validated['role']]);

        if ($validated['role'] === 'facility_admin') {
            $user->managedFacilities()->sync($validated['assigned_facility_ids'] ?? []);
        } elseif ($user->managedFacilities()->exists()) {
            $user->managedFacilities()->detach();
        }

        return redirect()->back()->with('success', "{$user->name}'s role updated to {$validated['role']}.");
    }

    /**
     * Toggle a user's active status. Disabled users cannot log in.
     */
    public function toggleActive(User $user)
    {
        $this->guardLastSuperAdmin($user, fn () => $user->is_active, 'disable');
        $this->guardSelf($user, 'disable your own account');

        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'activated' : 'disabled';

        return redirect()->back()->with('success', "{$user->name}'s account has been {$status}.");
    }

    /**
     * Regenerate a temporary password for an existing user.
     */
    public function regeneratePassword(User $user)
    {
        $tempPassword = Str::password(12);

        $user->update([
            'password' => Hash::make($tempPassword),
            'must_change_password' => true,
        ]);

        return redirect()->back()->with('newAccount', [
            'name' => $user->name,
            'email' => $user->email,
            'tempPassword' => $tempPassword,
        ]);
    }

    /**
     * Soft-delete a user. Their booking history is preserved.
     */
    public function destroy(User $user)
    {
        $this->guardLastSuperAdmin($user, fn () => true, 'delete');
        $this->guardSelf($user, 'delete your own account here — use your Profile settings instead');

        $user->delete(); // soft delete, thanks to the SoftDeletes trait

        return redirect()->back()->with('success', "{$user->name}'s account has been deleted.");
    }

    /**
     * Shared guard: prevent an action that would leave zero super_admins.
     * $willLeaveRole should return true if, after the action, this user would no longer
     * effectively be counted as an active super_admin (demoted, disabled, or deleted).
     */
    private function guardLastSuperAdmin(User $user, callable $willLeaveRole, string $action): void
    {
        if ($user->role !== 'super_admin' || !$willLeaveRole()) {
            return;
        }

        $remainingSuperAdmins = User::where('role', 'super_admin')
            ->where('is_active', true)
            ->where('id', '!=', $user->id)
            ->count();

        if ($remainingSuperAdmins === 0) {
            throw ValidationException::withMessages([
                'role' => "You cannot {$action} the only remaining Super Admin. Promote someone else first.",
            ]);
        }
    }

    /**
     * Shared guard: prevent a super_admin from disabling/deleting their own account
     * through this admin panel (self-deletion has its own dedicated, safer flow).
     */
    private function guardSelf(User $user, string $action): void
    {
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages([
                'role' => "You cannot {$action}.",
            ]);
        }
    }
}
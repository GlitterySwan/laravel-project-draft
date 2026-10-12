<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FacilityManagementController extends Controller
{
    /**
     * List facilities the authenticated facility_admin is assigned to manage.
     * Super admins see all facilities here too.
     */
    public function managed(): Response
    {
        $user = Auth::user();

        $query = Facility::with('facilityAdmins:id,name,email')->orderBy('name');

        if ($user->role !== 'super_admin') {
            $query->forUser($user);
        }

        return Inertia::render('Facilitator/ManagedFacilities', [
            'facilities' => $query->get(),
        ]);
    }

    /**
     * List facilities according to user role permissions.
     */
    public function index(): Response
    {
        $user = Auth::user();

        $facilities = Facility::with('facilityAdmins:id,name,email')->orderBy('name')->get();

        // Pass authenticated user details & managed facility IDs to frontend
        return Inertia::render('Admin/Facilities', [
            'facilities' => $facilities,
            'facilityAdmins' => $user->role === 'super_admin'
                ? User::where('role', 'facility_admin')->select('id', 'name', 'email')->orderBy('name')->get()
                : [],
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role, // 'super_admin', 'facility_admin', 'user'
                    'managed_facility_ids' => ($user->role === 'facility_admin' && method_exists($user, 'managedFacilities'))
    ? $user->managedFacilities()->pluck('facilities.id')->toArray()
    : [],
                ],
            ],
        ]);
    }

    /**
     * Store a newly created facility (Super Admin only).
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'super_admin') {
            abort(403, 'Unauthorized action.');
        }

        $validated = $this->validateFacility($request);
        $assignedAdminIds = $validated['assigned_admin_ids'] ?? [];
        unset($validated['assigned_admin_ids']);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '-' . time() . '.' . $file->extension();
            $path = $file->storePubliclyAs('facilities', $fileName, 'public');
            $validated['imageUrl'] = Storage::url($path);
        } elseif (blank($validated['imageUrl'] ?? null)) {
            return redirect()->back()->withErrors(['image' => 'Please upload an image or provide an image URL.']);
        }

        unset($validated['image']);

        $baseId = Str::slug($validated['name']);
        $id = $baseId;
        $suffix = 1;
        while (Facility::where('id', $id)->exists()) {
            $id = "{$baseId}-{$suffix}";
            $suffix++;
        }

        $facility = Facility::create([...$validated, 'id' => $id]);
        $facility->facilityAdmins()->sync($assignedAdminIds);

        return redirect()->back()->with('success', 'Facility created.');
    }

    /**
     * Update an existing facility (Super Admin or Facility Admin of this specific facility).
     */
    public function update(Request $request, Facility $facility)
    {
        $user = $request->user();

        // Super admins can edit any facility; Facility admins can only edit facilities they manage
        $isSuperAdmin = $user->role === 'super_admin';
        $isManagedFacilityAdmin = $user->role === 'facility_admin' && $facility->facilityAdmins()->where('users.id', $user->id)->exists();

        if (!$isSuperAdmin && !$isManagedFacilityAdmin) {
            abort(403, 'You do not have permission to edit this facility.');
        }

        $validated = $this->validateFacility($request);

        // Facility admins cannot reassign admins; only Super Admins can
        if ($isSuperAdmin) {
            $assignedAdminIds = $validated['assigned_admin_ids'] ?? [];
            $facility->facilityAdmins()->sync($assignedAdminIds);
        }
        unset($validated['assigned_admin_ids']);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '-' . time() . '.' . $file->extension();
            $path = $file->storePubliclyAs('facilities', $fileName, 'public');
            $validated['imageUrl'] = Storage::url($path);
        } elseif (blank($validated['imageUrl'] ?? null)) {
            $validated['imageUrl'] = $facility->imageUrl;
        }

        unset($validated['image']);

        $facility->update($validated);

        return redirect()->back()->with('success', 'Facility updated.');
    }

    /**
     * Delete a facility (Super Admin only).
     */
    public function destroy(Request $request, Facility $facility)
    {
        if ($request->user()->role !== 'super_admin') {
            abort(403, 'Unauthorized action.');
        }

        $facility->delete();

        return redirect()->back()->with('success', 'Facility deleted.');
    }

    /**
     * Shared validation rules for store/update.
     */
    private function validateFacility(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'type' => ['required', Rule::in(['Venue', 'Laboratory'])],
            'capacity' => 'nullable|integer|min:1',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'imageUrl' => 'nullable|string',
            'requirement' => ['required', Rule::in(['STANDARD', 'CONSENT_REQUIRED'])],
            'location' => 'required|string|max:255',
            'requiresWeekendConsent' => 'boolean',
            'allowTdevsManpower' => 'boolean',
            'assigned_admin_ids' => 'nullable|array',
            'assigned_admin_ids.*' => 'exists:users,id',
        ]);
    }
}
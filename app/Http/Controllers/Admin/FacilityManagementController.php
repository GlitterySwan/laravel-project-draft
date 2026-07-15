<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Facility;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FacilityManagementController extends Controller
{
    /**
     * List all facilities for management.
     */
    public function index(): Response
    {
        $facilities = Facility::with('facilityAdmins:id,name,email')->orderBy('name')->get();

        return Inertia::render('Admin/Facilities', [
            'facilities' => $facilities,
            'facilityAdmins' => \App\Models\User::where('role', 'facility_admin')
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Store a newly created facility.
     */
    public function store(Request $request)
    {
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
     * Update an existing facility.
     */
    public function update(Request $request, Facility $facility)
    {
        $validated = $this->validateFacility($request);
        $assignedAdminIds = $validated['assigned_admin_ids'] ?? [];
        unset($validated['assigned_admin_ids']);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $fileName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '-' . time() . '.' . $file->extension();
            $path = $file->storePubliclyAs('facilities', $fileName, 'public');
            $validated['imageUrl'] = Storage::url($path);
        } elseif (blank($validated['imageUrl'] ?? null)) {
            $validated['imageUrl'] = $facility->imageUrl;
        }

        $facility->update($validated);
        $facility->facilityAdmins()->sync($assignedAdminIds);

        return redirect()->back()->with('success', 'Facility updated.');
    }

    /**
     * Delete a facility.
     */
    public function destroy(Facility $facility)
    {
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
            'type' => ['required', Rule::in(['Venue', 'Laboratory', 'Equipment'])],
            'capacity' => 'nullable|integer|min:1',
            'description' => 'required|string',
            'image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'imageUrl' => 'nullable|string|url',
            'requirement' => ['required', Rule::in(['STANDARD', 'CONSENT_REQUIRED'])],
            'location' => 'required|string|max:255',
            'requiresWeekendConsent' => 'boolean',
            'allowTdevsManpower' => 'boolean',
            'assigned_admin_ids' => 'nullable|array',
            'assigned_admin_ids.*' => 'exists:users,id',
        ]);
    }
}
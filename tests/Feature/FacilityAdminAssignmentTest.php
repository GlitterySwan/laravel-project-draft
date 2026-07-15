<?php

namespace Tests\Feature;

use App\Http\Controllers\Facilitator\BookingApprovalController;
use App\Models\Booking;
use App\Models\Facility;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacilityAdminAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_facility_admin_only_sees_bookings_for_assigned_facility(): void
    {
        $facilityAdmin = User::factory()->create(['role' => 'facility_admin']);
        $assignedFacility = Facility::create([
            'id' => 'assigned-facility',
            'name' => 'Assigned Facility',
            'type' => 'Venue',
            'capacity' => 50,
            'description' => 'Assigned facility',
            'imageUrl' => 'https://example.com/assigned.jpg',
            'requirement' => 'STANDARD',
            'location' => 'Building A',
            'requiresWeekendConsent' => false,
            'allowTdevsManpower' => false,
        ]);
        $otherFacility = Facility::create([
            'id' => 'other-facility',
            'name' => 'Other Facility',
            'type' => 'Venue',
            'capacity' => 30,
            'description' => 'Other facility',
            'imageUrl' => 'https://example.com/other.jpg',
            'requirement' => 'STANDARD',
            'location' => 'Building B',
            'requiresWeekendConsent' => false,
            'allowTdevsManpower' => false,
        ]);

        $facilityAdmin->managedFacilities()->attach($assignedFacility);

        Booking::create([
            'facility_id' => $assignedFacility->id,
            'user_id' => null,
            'guest_name' => 'Jane Doe',
            'guest_email' => 'jane@example.com',
            'guest_phone' => '123456789',
            'date' => '2026-07-15',
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => 'PENDING',
            'notes' => 'Need access',
        ]);

        Booking::create([
            'facility_id' => $otherFacility->id,
            'user_id' => null,
            'guest_name' => 'John Doe',
            'guest_email' => 'john@example.com',
            'guest_phone' => '987654321',
            'date' => '2026-07-16',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'PENDING',
            'notes' => 'Should be hidden',
        ]);

        $this->actingAs($facilityAdmin);

        $query = (new BookingApprovalController())->getVisibleBookingsQuery($facilityAdmin);
        $pendingBookings = (clone $query)->where('status', 'PENDING')->orderBy('date')->get();

        $this->assertCount(1, $pendingBookings);
        $this->assertSame('Assigned Facility', $pendingBookings->first()->facility->name);
    }

    public function test_super_admin_can_assign_facility_admins_to_a_facility(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $facilityAdmin = User::factory()->create(['role' => 'facility_admin']);
        $facility = Facility::create([
            'id' => 'assignable-facility',
            'name' => 'Assignable Facility',
            'type' => 'Venue',
            'capacity' => 40,
            'description' => 'Assignable facility',
            'imageUrl' => 'https://example.com/assignable.jpg',
            'requirement' => 'STANDARD',
            'location' => 'Building C',
            'requiresWeekendConsent' => false,
            'allowTdevsManpower' => false,
        ]);

        $response = $this->actingAs($superAdmin)->patch(route('admin.facilities.update', $facility), [
            'name' => 'Assignable Facility',
            'type' => 'Venue',
            'capacity' => 40,
            'description' => 'Assignable facility',
            'imageUrl' => 'https://example.com/assignable.jpg',
            'requirement' => 'STANDARD',
            'location' => 'Building C',
            'requiresWeekendConsent' => false,
            'allowTdevsManpower' => false,
            'assigned_admin_ids' => [$facilityAdmin->id],
        ]);

        $response->assertRedirect();
        $facility->refresh();
        $this->assertTrue($facility->facilityAdmins()->whereKey($facilityAdmin->id)->exists());
    }
}

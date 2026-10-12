<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasUuids;

    // Tell Laravel the primary key is a string (UUID), not an auto-incrementing number
    protected $keyType = 'string';
    public $incrementing = false;

    // Fields that are allowed to be mass-assigned via Booking::create([...])
    protected $fillable = [
        'facility_id',
        'user_id',
        'guest_name',
        'guest_email',
        'guest_phone',
        'date',
        'booking_date',
        'start_time',
        'end_time',
        'status',
        'notes',
        'attendees',
        'needs_manpower',
        'consent_file_uploaded',
        'consent_file_name',
        'consent_file_path',
        'approved_by',
        'approved_at',
        'decline_reason',
        'rejection_reason',
        'checked_in_at',
        'checked_out_at',
        'overtime_notified_at',
    ];

    // Automatically converts these fields to the right PHP type when you read them
    protected $casts = [
        'date' => 'date:Y-m-d',
        'booking_date' => 'date:Y-m-d',
        'needs_manpower' => 'boolean',
        'consent_file_uploaded' => 'boolean',
        'approved_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'overtime_notified_at' => 'datetime',
    ];

    // Relationship: a booking belongs to one facility
    public function facility()
    {
        return $this->belongsTo(Facility::class);
    }

    // Relationship: a booking belongs to one user (nullable for guests)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, User $user): Builder
    {
        if ($user->role === 'super_admin') {
            return $query;
        }

        return $query->whereHas('facility', function ($facilityQuery) use ($user) {
            $facilityQuery->forUser($user);
        });
    }
}

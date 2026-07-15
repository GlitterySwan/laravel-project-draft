<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facility extends Model
{
    protected $guarded = [];
    protected $keyType = 'string';
    public $incrementing = false;

    protected $casts = [
        'requiresWeekendConsent' => 'boolean',
        'allowTdevsManpower' => 'boolean',
        'capacity' => 'integer',
    ];

    public function facilityAdmins()
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function admins()
    {
        return $this->facilityAdmins();
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
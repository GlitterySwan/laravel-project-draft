<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'auto_approve_bookings',
        'overtime_fee_per_hour',
        'auto_purge_unapproved_days',
    ];
    protected $casts = [
        'auto_approve_bookings' => 'boolean',
        'overtime_fee_per_hour' => 'decimal:2',
        'auto_purge_unapproved_days' => 'integer',
    ];

    public static function current(): self
    {
        return static::firstOrCreate([], [
            'auto_approve_bookings' => false,
            'overtime_fee_per_hour' => 0,
            'auto_purge_unapproved_days' => 0,
        ]);
    }
}

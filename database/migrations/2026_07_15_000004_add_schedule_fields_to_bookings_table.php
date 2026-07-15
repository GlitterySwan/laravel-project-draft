<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->date('booking_date')->nullable()->after('date');
            $table->text('rejection_reason')->nullable()->after('decline_reason');
        });

        DB::table('bookings')->whereNull('booking_date')->update([
            'booking_date' => DB::raw('date'),
        ]);

        DB::table('bookings')->update([
            'status' => DB::raw("lower(status)"),
        ]);
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['booking_date', 'rejection_reason']);
        });
    }
};

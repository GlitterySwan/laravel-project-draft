<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('bookings', 'is_qr_verified')) {
            Schema::table('bookings', function (Blueprint $table) {
                $table->dropColumn('is_qr_verified');
            });
        }
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('is_qr_verified')->default(false);
        });
    }
};
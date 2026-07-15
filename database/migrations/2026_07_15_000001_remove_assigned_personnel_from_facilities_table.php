<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('facilities', 'assigned_personnel')) {
            Schema::table('facilities', function (Blueprint $table) {
                $table->dropColumn('assigned_personnel');
            });
        }
    }

    public function down(): void
    {
        Schema::table('facilities', function (Blueprint $table) {
            $table->json('assigned_personnel')->nullable();
        });
    }
};

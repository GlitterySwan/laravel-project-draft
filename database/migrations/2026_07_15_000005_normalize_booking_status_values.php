<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('bookings')->update(['status' => DB::raw('lower(status)')]);
    }

    public function down(): void
    {
        DB::table('bookings')->update(['status' => DB::raw('upper(status)')]);
    }
};

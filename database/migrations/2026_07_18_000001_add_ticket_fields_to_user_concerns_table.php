<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_concerns', function (Blueprint $table) {
            $table->date('appeal_date')->nullable()->after('message');
            $table->string('category')->nullable()->after('appeal_date');
            $table->text('detailed_info')->nullable()->after('category');
            $table->text('admin_reply')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('user_concerns', function (Blueprint $table) {
            $table->dropColumn(['appeal_date', 'category', 'detailed_info', 'admin_reply']);
        });
    }
};
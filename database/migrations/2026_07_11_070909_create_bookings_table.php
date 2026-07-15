<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('facility_id');
            $table->string('user_id')->nullable(); // nullable for guest bookings

            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_phone')->nullable();

            $table->date('date');
            $table->string('start_time');
            $table->string('end_time');

            $table->enum('status', ['pending', 'approved', 'declined', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();

            $table->integer('attendees')->nullable();
            $table->boolean('needs_manpower')->default(false);

            $table->boolean('consent_file_uploaded')->default(false);
            $table->string('consent_file_name')->nullable();
            $table->string('consent_file_path')->nullable();

            $table->string('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            $table->foreign('facility_id')->references('id')->on('facilities')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

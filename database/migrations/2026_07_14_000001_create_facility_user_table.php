<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facility_user', function (Blueprint $table) {
            $table->string('facility_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->foreign('facility_id')->references('id')->on('facilities')->cascadeOnDelete();
            $table->primary(['facility_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facility_user');
    }
};

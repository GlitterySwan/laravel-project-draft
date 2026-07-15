<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('facilities', function (Blueprint $table) {
        // We use string id because your Figma uses string keys ('f3', 'itdif')
        $table->string('id')->primary(); 
        $table->string('name');
        $table->enum('type', ['Venue', 'Laboratory', 'Equipment']);
        $table->integer('capacity')->nullable(); // Nullable because some have 'null'
        $table->text('description');
        $table->string('imageUrl');
        $table->enum('requirement', ['STANDARD', 'CONSENT_REQUIRED']);
        $table->string('location');
        $table->boolean('requiresWeekendConsent')->default(true);
        $table->boolean('allowTdevsManpower')->default(true);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facilities');
    }
};

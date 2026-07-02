<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    
    public function up(): void
    {
        Schema::create('barcode_settings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            $table->boolean('auto_generate_on_create')->default(false);
            $table->boolean('auto_detect_gtin_format')->default(true);
            $table->boolean('prevent_zero_start_end')->default(false);
            $table->string('barcode_format')->default('CODE128');
            $table->string('barcode_pattern')->nullable();
            $table->string('contextual_pricing_value')->nullable();
            $table->timestamps();
        });
    }


    
    public function down(): void
    {
        Schema::dropIfExists('barcode_settings');
    }
};

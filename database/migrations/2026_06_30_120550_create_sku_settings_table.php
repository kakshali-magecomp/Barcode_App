<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('sku_settings'); // Prevent duplicates or collision errors

        Schema::create('sku_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            
            // Text Inputs
            $table->string('sku_prefix')->nullable();
            $table->string('sku_auto_number_start')->default('1001');
            $table->string('sku_suffix')->nullable();
            $table->string('sku_delimiter')->default('-');

            // Substring Rules Select Dropdowns
            $table->string('segment_product_title')->default('none');
            $table->string('segment_product_vendor')->default('none');
            $table->string('segment_product_type')->default('none');
            $table->string('segment_option1')->default('none');
            $table->string('segment_option2')->default('none');
            $table->string('segment_option3')->default('none');
            $table->string('segment_metafield')->nullable();
            $table->string('segment_metafield_rule')->default('full');
            // Toggle Rules Checkboxes
            $table->boolean('hide_options_1_2_3')->default(false);
            $table->boolean('force_uppercase_fields')->default(true);
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sku_settings');
    }
};

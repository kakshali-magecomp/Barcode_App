<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('template_designs', function (Blueprint $table) {
            $table->id();
            // Connects the design settings row to your primary barcode_templates table row entry
            $table->foreignId('barcode_template_id')->constrained('barcode_templates')->onDelete('cascade');
            
            // Layout Margins
            $table->integer('margin_top')->default(5);
            $table->integer('margin_bottom')->default(5);
            $table->integer('margin_left')->default(5);
            $table->integer('margin_right')->default(5);

            // Line Layers Properties
            $table->boolean('line1_sku')->default(true);
            $table->boolean('line2_name')->default(true);
            $table->boolean('line2_price')->default(true);
            $table->string('line2_currency_format')->default('${{amount}}');
            $table->boolean('line2_show_price_per_unit')->default(false);
            $table->boolean('line2_variant_option1')->default(true);
            $table->boolean('line3_vendor')->default(false);

            // Graphical Symbol Layer Properties
            $table->boolean('symbol_enabled')->default(true);
            $table->string('symbol_type')->default('QR'); // 'BARCODE' or 'QR'
            $table->string('symbol_color')->default('#000000');
            $table->string('symbol_logo_filename')->nullable();
            $table->string('symbol_field_source')->default('barcode_value');
            $table->boolean('hide_barcode_value')->default(false);
            
            // Barcode Range Metrics
            $table->integer('symbol_font_size')->default(12);
            $table->integer('symbol_bar_width')->default(2);
            $table->integer('symbol_bar_height')->default(35);
            
            // QR Code Matrix Styles
            $table->string('symbol_width_px')->default('140');
            $table->string('symbol_margin_px')->default('1');
            $table->string('qr_dot_type')->default('square');
            $table->string('qr_corner_dot_type')->default('square');
            $table->string('qr_corner_square_type')->default('square');
            
            // Printing Quantity
            $table->integer('print_qty')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_designs');
    }
};

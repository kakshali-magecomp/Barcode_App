<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {

            $table->id();

            //barcode setting
            $table->boolean('auto_generate_barcode')->default(true);
            $table->boolean('auto_detect_gtin')->default(true);
            $table->boolean('allow_non_zero')->default(false);

            $table->string('barcode_type')->default('CODE128');
            $table->string('barcode_pattern')->default('[N.8][N.8]');
            $table->string('country_code')->default('US');
            $table->boolean('show_human_text')->default(true);

            //sku setting
            $table->boolean('auto_generate_sku')->default(false);
            $table->string('sku_type')->default('numeric');
            $table->integer('sku_length')->default(6);
            $table->string('sku_prefix')->nullable();
            $table->string('sku_suffix')->nullable();
            $table->string('sku_pattern')->default('SKU-[N.6]');

           //printing setting
            $table->string('printer_type')->default('thermal');
            $table->string('paper_size')->default('A4');
            $table->string('paper_orientation')->default('portrait');

            $table->integer('margin_top')->default(5);
            $table->integer('margin_left')->default(5);

            $table->integer('default_print_quantity')->default(1);

            $table->boolean('show_barcode')->default(true);
            $table->boolean('show_sku')->default(true);
            $table->boolean('show_product_name')->default(true);
            $table->boolean('show_price')->default(false);

            $table->boolean('auto_print')->default(false);

            //stocky setting
            $table->boolean('sync_stocky')->default(false);

            //translation setting
            $table->string('language')->default('en');

           //API setting
            $table->text('api_key')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
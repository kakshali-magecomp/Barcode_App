<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
   
    public function up(): void
{
    Schema::create('print_settings', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        
        // Base Configurations
        $table->string('print_mode')->default('dialog'); 
        $table->boolean('rotate_180')->default(false);
        $table->integer('label_width')->default(32);   
        $table->integer('label_height')->default(19);  
        $table->integer('margin_top')->default(0);     
        $table->integer('margin_left')->default(0);    
        
        // Fields visible on your form
        $table->integer('price_decimal_number')->default(2);
        $table->string('currency_format')->default('without_currency'); 
        $table->unsignedBigInteger('default_print_template_id')->nullable(); 
        $table->string('default_generate_option')->default('manual');   
        $table->integer('default_print_label_quantity')->default(1);
        $table->decimal('vat_percentage', 5, 2)->default(0.00);
        $table->boolean('sort_by_sku')->default(false);

        // NEW CHECKBOX FIELDS MATCHING THE SCREENSHOT
        $table->boolean('hide_product_draft')->default(false);
        $table->boolean('hide_product_archived')->default(false);
        $table->boolean('use_shopify_flow_action')->default(false);
        
        $table->timestamps();
    });
}


    public function down(): void
    {
        Schema::dropIfExists('print_settings');
    }
};

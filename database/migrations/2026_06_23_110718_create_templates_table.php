<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('templates', function (Blueprint $table) {

            $table->id();

            
            //General Information
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('note')->nullable();

           
            // Template Type
            // barcode
            // image
            
            $table->enum('template_type', [
                'barcode',
                'image',
            ])->default('barcode');

            //Paper Settings
            $table->string('paper_brand')->nullable();
            $table->string('paper_model')->nullable();
            $table->string('paper_size')->nullable();

            
            //Label Size
            $table->integer('label_width')->default(60);
            $table->integer('label_height')->default(40);

            
            //Padding
            $table->integer('padding_top')->default(5);
            $table->integer('padding_bottom')->default(5);
            $table->integer('padding_left')->default(5);
            $table->integer('padding_right')->default(5);

            
            //Margin
            $table->integer('margin_top')->default(5);
            $table->integer('margin_bottom')->default(5);
            $table->integer('margin_left')->default(5);
            $table->integer('margin_right')->default(5);

            
            //Barcode Options
            $table->boolean('show_product_name')->default(true);
            $table->boolean('show_price')->default(true);
            $table->boolean('show_sku')->default(true);
            $table->boolean('show_barcode')->default(true);
            $table->boolean('show_qrcode')->default(false);


            // Uploaded background image
            $table->string('background_image')->nullable();

            // Optional logo
            $table->string('logo')->nullable();

            // Show uploaded image while printing
            $table->boolean('show_image')->default(false);

            // Image fit mode
            $table->string('image_fit')->default('contain');
            // contain | cover | fill

            
            //Custom CSS
            $table->json('custom_css')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
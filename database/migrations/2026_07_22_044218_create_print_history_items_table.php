<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_history_items', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('print_history_id');

            $table->string('product_id')->nullable();

            $table->string('variant_id');

            $table->string('product_title');

            $table->string('sku')->nullable();

            $table->string('barcode')->nullable();

            $table->integer('qty')->default(1);

            $table->timestamps();

            $table->foreign('print_history_id')
                ->references('id')
                ->on('print_histories')
                ->onDelete('cascade');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_history_items');
    }
};
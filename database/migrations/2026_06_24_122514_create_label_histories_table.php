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
        Schema::create('label_histories', function (Blueprint $table) {
            $table->id();

            $table->string('type'); // generate or print

            $table->string('template_name')->nullable();

            $table->integer('product_count')->default(0);

            $table->json('products')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('label_histories');
    }
};

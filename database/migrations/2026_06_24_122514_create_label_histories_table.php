<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('label_histories', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // generate, print, generate_print
            $table->unsignedBigInteger('template_id')->nullable();
            $table->string('template_name')->nullable();
            $table->integer('product_count')->default(0);
            $table->json('products')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('label_histories');
    }
};
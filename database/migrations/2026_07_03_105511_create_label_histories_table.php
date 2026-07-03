<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('label_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('barcode_template_id')->constrained()->cascadeOnDelete();

            $table->string('variant_id');
            $table->string('product_title');
            $table->string('sku');
            $table->string('price')->nullable();
            $table->string('vendor')->nullable();

            $table->integer('quantity')->default(1);

            $table->timestamp('printed_at')->useCurrent();

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

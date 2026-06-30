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
        Schema::create('barcode_templates', function (Blueprint $table) {
            $table->id();
        
        // This helper automatically detects and matches the 'id' type of the 'users' table
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        
        $table->string('template_name');
        $table->text('description')->nullable();
        $table->text('note')->nullable();
        $table->string('paper_brand')->nullable();
        $table->string('paper_model')->nullable();
        $table->json('layout_settings')->nullable();
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barcode_templates');
    }
};

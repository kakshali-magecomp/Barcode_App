<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('print_histories', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('user_id');

            $table->unsignedBigInteger('template_id')->nullable();

            $table->integer('print_qty')->default(1);

            $table->string('client_ip')->nullable();

            $table->timestamp('printed_at');

            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('print_histories');
    }
};
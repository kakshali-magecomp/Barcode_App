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
        Schema::table('print_history_items', function (Blueprint $table) {
        $table->text('online_url')->nullable()->after('barcode');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('print_history_items', function (Blueprint $table) {
        $table->dropColumn('online_url');
    });
    }
};

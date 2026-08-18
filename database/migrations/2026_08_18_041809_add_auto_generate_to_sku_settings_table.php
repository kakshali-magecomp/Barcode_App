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
       Schema::table('sku_settings', function (Blueprint $table) {
            $table->boolean('auto_generate_on_create')->default(false)->after('force_uppercase_fields');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sku_settings', function (Blueprint $table) {
            $table->dropColumn('auto_generate_on_create');
        });
    }
};

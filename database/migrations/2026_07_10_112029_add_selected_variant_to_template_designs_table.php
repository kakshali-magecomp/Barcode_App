<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('template_designs', function (Blueprint $table) {

            $table->string('selected_variant_id')
                  ->nullable()
                  ->after('barcode_template_id');

        });
    }

    public function down(): void
    {
        Schema::table('template_designs', function (Blueprint $table) {

            $table->dropColumn('selected_variant_id');

        });
    }
};
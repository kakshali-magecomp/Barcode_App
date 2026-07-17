<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{
    public function up(): void
    {
        Schema::table('label_histories', function (Blueprint $table) {

            $table->string('template_name')
                ->nullable()
                ->after('barcode_template_id');

            $table->string('print_type')
                ->default('product')
                ->after('template_name');

            $table->string('barcode_value')
                ->nullable()
                ->after('sku');

            $table->string('barcode_format')
                ->nullable()
                ->after('barcode_value');

            $table->string('symbol_type')
                ->nullable()
                ->after('barcode_format');

        });
    }

    public function down(): void
    {
        Schema::table('label_histories', function (Blueprint $table) {

            $table->dropColumn([
                'template_name',
                'print_type',
                'barcode_value',
                'barcode_format',
                'symbol_type',
            ]);

        });
    }
};
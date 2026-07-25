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
        Schema::table('print_history_items', function (Blueprint $table) {

            $table->decimal('price', 10, 2)->nullable()->after('barcode');

            $table->string('online_url')->nullable()->after('price');

            $table->string('vendor')->nullable()->after('online_url');

            $table->string('variant_title')->nullable()->after('vendor');

            $table->string('option_1')->nullable();

            $table->string('option_2')->nullable();

            $table->string('option_3')->nullable();

        });
    }

    public function down(): void
    {
        Schema::table('print_history_items', function (Blueprint $table) {

            $table->dropColumn([
                'price',
                'online_url',
                'vendor',
                'variant_title',
                'option_1',
                'option_2',
                'option_3'
            ]);

        });
    }
};

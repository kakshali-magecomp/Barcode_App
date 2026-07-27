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

        if (!Schema::hasColumn('print_history_items', 'price')) {
            $table->decimal('price', 10, 2)->nullable()->after('barcode');
        }

        if (!Schema::hasColumn('print_history_items', 'online_url')) {
            $table->string('online_url')->nullable()->after('price');
        }

        if (!Schema::hasColumn('print_history_items', 'vendor')) {
            $table->string('vendor')->nullable();
        }

        if (!Schema::hasColumn('print_history_items', 'variant_title')) {
            $table->string('variant_title')->nullable();
        }

        if (!Schema::hasColumn('print_history_items', 'option_1')) {
            $table->string('option_1')->nullable();
        }

        if (!Schema::hasColumn('print_history_items', 'option_2')) {
            $table->string('option_2')->nullable();
        }

        if (!Schema::hasColumn('print_history_items', 'option_3')) {
            $table->string('option_3')->nullable();
        }
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

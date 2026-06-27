<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    use HasFactory;

    protected $fillable = [

        'auto_generate_barcode',
        'auto_detect_gtin',
        'allow_non_zero',

        'barcode_type',
        'barcode_pattern',
        'country_code',
        'show_human_text',

        'auto_generate_sku',
        'sku_type',
        'sku_length',
        'sku_prefix',
        'sku_suffix',
        'sku_pattern',

        'printer_type',
        'paper_size',
        'paper_orientation',

        'margin_top',
        'margin_left',

        'default_print_quantity',

        'show_barcode',
        'show_sku',
        'show_product_name',
        'show_price',

        'auto_print',

        'sync_stocky',
        'language',
        'api_key',
    ];

    protected $casts = [


        'auto_generate_barcode' => 'boolean',
        'auto_detect_gtin'      => 'boolean',
        'allow_non_zero'        => 'boolean',
        'show_human_text'       => 'boolean',

        'auto_generate_sku' => 'boolean',

        'show_barcode'      => 'boolean',
        'show_sku'          => 'boolean',
        'show_product_name' => 'boolean',
        'show_price'        => 'boolean',
        'auto_print'        => 'boolean',

        'sync_stocky' => 'boolean',

        'sku_length'             => 'integer',
        'margin_top'             => 'integer',
        'margin_left'            => 'integer',
        'default_print_quantity' => 'integer',
    ];
}
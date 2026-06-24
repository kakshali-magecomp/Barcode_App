<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'name',
        'description',
        'note',
        'paper_size',
        'paper_brand',
        'paper_model',
        'template_type',
        'label_width',
        'label_height',
        'padding_top',
        'padding_bottom',
        'padding_left',
        'padding_right',
        'margin_top',
        'margin_bottom',
        'margin_left',
        'margin_right',
        'show_product_name',
        'show_price',
        'show_sku',
        'show_barcode',
        'show_qrcode',
        'custom_css'
    ];

    protected $casts = [
        'show_product_name' => 'boolean',
        'show_price' => 'boolean',
        'show_sku' => 'boolean',
        'show_barcode' => 'boolean',
        'show_qrcode' => 'boolean',
        'custom_css' => 'array',
    ];
}

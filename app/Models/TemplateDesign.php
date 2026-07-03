<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateDesign extends Model
{
   // Verify these exact column name properties arrays keys are declared inside your $fillable array model:
protected $fillable = [
    'barcode_template_id', 'margin_top', 'margin_bottom', 'margin_left', 'margin_right',
    'line1_sku', 'line2_name', 'line2_price', 'line2_currency_format', 
    'line2_show_price_per_unit', 'line2_variant_option1', 'line3_vendor',
    'symbol_enabled', 'symbol_type', 'symbol_color', 'symbol_logo_filename',
    'symbol_field_source', 'hide_barcode_value', 'symbol_font_size', 
    'symbol_bar_width', 'symbol_bar_height', 'symbol_width_px', 'symbol_margin_px',
    'qr_dot_type', 'qr_corner_dot_type', 'qr_corner_square_type', 'print_qty'
];


    protected $casts = [
        'line1_sku'                 => 'boolean',
        'line2_name'                => 'boolean',
        'line2_price'               => 'boolean',
        'line2_show_price_per_unit' => 'boolean',
        'line2_variant_option1'     => 'boolean',
        'line3_vendor'              => 'boolean',
        'symbol_enabled'            => 'boolean',
        'hide_barcode_value'        => 'boolean',
    ];

    public function barcodeTemplate()
    {
        return $this->belongsTo(BarcodeTemplate::class);
    }
}

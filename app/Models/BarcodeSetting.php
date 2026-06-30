<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarcodeSetting extends Model
{
    protected $fillable = [
        'user_id',
        'auto_generate_on_create',
        'auto_detect_gtin_format',
        'prevent_zero_start_end',
        'barcode_format',
        'barcode_pattern',
        'contextual_pricing_value'
    ];

    protected $casts = [
        'auto_generate_on_create' => 'boolean',
        'auto_detect_gtin_format' => 'boolean',
        'prevent_zero_start_end' => 'boolean',
    ];
}

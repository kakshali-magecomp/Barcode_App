<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrintSetting extends Model
{
    protected $table = 'print_settings';

    protected $fillable = [
        'user_id', 
        'print_mode', 
        'rotate_180', 
        'label_width', 
        'label_height', 
        'margin_top', 
        'margin_left',
        'price_decimal_number', 
        'currency_format', 
        'default_print_template_id', 
        'default_generate_option', 
        'default_print_label_quantity', 
        'vat_percentage',
        'sort_by_sku', 
        
        // ADDED: New checkboxes mass assignment allowance
        'hide_product_draft', 
        'hide_product_archived', 
        'use_shopify_flow_action'
    ];

    protected $casts = [
        'rotate_180'                   => 'boolean', 
        'sort_by_sku'                  => 'boolean', 
        'vat_percentage'               => 'float',
        'label_width'                  => 'integer', 
        'label_height'                 => 'integer', 
        'margin_top'                   => 'integer', 
        'margin_left'                  => 'integer',
        'price_decimal_number'         => 'integer', 
        'default_print_label_quantity' => 'integer',
        'default_print_template_id'    => 'integer',

        // ADDED: Native boolean typecasting enforcements
        'hide_product_draft'           => 'boolean', 
        'hide_product_archived'        => 'boolean', 
        'use_shopify_flow_action'      => 'boolean'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

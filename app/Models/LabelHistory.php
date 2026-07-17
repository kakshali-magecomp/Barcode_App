<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabelHistory extends Model
{
    protected $fillable = [

        'user_id',
        'barcode_template_id',
        'template_name',
        'variant_id',
        'product_title',
        'sku',
        'barcode_value',
        'barcode_format',
        'symbol_type',
        'print_type',
        'price',
        'vendor',
        'quantity',
        'printed_at',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
    ];
    public function template()
    {
        return $this->belongsTo(
            BarcodeTemplate::class,
            'barcode_template_id'
        );
    }

    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function isTemplatePreview()
    {
        return $this->print_type === 'template_preview';
    }
    public function isProductPrint()
    {
        return $this->print_type === 'product';
    }
}
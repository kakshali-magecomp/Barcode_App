<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabelHistory extends Model
{
    protected $fillable = [
        'user_id',
        'barcode_template_id',
        'variant_id',
        'product_title',
        'sku',
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
}
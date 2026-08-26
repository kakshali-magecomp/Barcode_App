<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintHistoryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'print_history_id',
        'product_id',
        'variant_id',
        'product_title',
        'sku',
        'barcode',
        'barcode_format',
        'template_settings',
        'price',
        'currency_code',
        'online_url',
        'vendor',
        'variant_title',
        'option_1',
        'option_2',
        'option_3',
        'qty',
    ];
    protected $casts = [
        'template_settings' => 'array',
    ];

    /**
     * Belongs to Print History
     */
    public function history()
    {
        return $this->belongsTo(
            PrintHistory::class,
            'print_history_id'
        );
    }
}
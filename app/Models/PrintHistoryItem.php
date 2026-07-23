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
        'qty',
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
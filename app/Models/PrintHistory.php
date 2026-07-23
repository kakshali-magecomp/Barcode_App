<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_id',
        'print_qty',
        'client_ip',
        'printed_at',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
    ];

    /**
     * One Print History has many printed products.
     */
    public function items()
    {
        return $this->hasMany(
            PrintHistoryItem::class,
            'print_history_id'
        );
    }

    /**
     * Template relation
     */
    public function template()
    {
        return $this->belongsTo(
            BarcodeTemplate::class,
            'template_id'
        );
    }

    /**
     * User relation
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
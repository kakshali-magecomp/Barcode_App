<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabelHistory extends Model
{
    protected $fillable = [
        'type',
        'template_id',
        'template_name',
        'product_count',
        'products'
    ];

    protected $casts = [
        'products' => 'array',
    ];
}
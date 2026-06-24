<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LabelHistory extends Model
{
    protected $fillables = [
        'type',
        'template_name',
        'product_count',
        'products'
    ];
    protected $casts = [
        'products' => 'array'
    ];
}

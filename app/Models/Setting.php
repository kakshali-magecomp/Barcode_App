<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'settings'
    ];

    protected $casts = [
        'settings'=> 'array',
    ];  
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;


class BarcodeTemplate extends Model
{
    protected $fillable = [
        'user_id',
        'template_name',
        'description',
        'note',
        'paper_brand',
        'paper_model',
        'layout_setings'
    ];

    protected $casts = [
        'layout_setings' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // public function barcode()
    // {
    //     return $this->belongsTo(BarcodeTemplate::class);
    // }

    // public function barcodeTemplates(): HasMany
    // {
    //     return $this->hasMany(BarcodeTemplate::class, 'user_id');
    // }

    public function design()
    {
        return $this->hasOne(
            TemplateDesign::class,
            'barcode_template_id'
        );
    }
    public function labelHistories(): HasMany
    {
        return $this->hasMany(LabelHistory::class, 'barcode_template_id');
    }

}

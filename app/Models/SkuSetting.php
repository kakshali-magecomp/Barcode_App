<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SkuSetting extends Model
{
    protected $table = 'sku_settings';

    protected $fillable = [
        'user_id', 'sku_prefix', 'sku_auto_number_start', 'sku_suffix', 'sku_delimiter',
        'segment_product_title', 'segment_product_vendor', 'segment_product_type',
        'segment_option1', 'segment_option2', 'segment_option3', 'segment_metafield','segment_metafield_rule',
        'hide_options_1_2_3', 'force_uppercase_fields'
    ];

    protected $casts = [
        'hide_options_1_2_3'     => 'boolean',
        'force_uppercase_fields' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

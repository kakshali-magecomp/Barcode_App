<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [

        //General Information
        'name',
        'description',
        'note',
        //Paper Settings
        'paper_brand',
        'paper_model',
        'paper_size',
        //Template Type
        'template_type',
        //Label Size
        'label_width',
        'label_height',
        //Padding
        'padding_top',
        'padding_bottom',
        'padding_left',
        'padding_right',
        //Margin
        'margin_top',
        'margin_bottom',
        'margin_left',
        'margin_right',        
        //Barcode Settings
        'show_product_name',
        'show_price',
        'show_sku',
        'show_barcode',
        'show_qrcode',
        //Image Template
        'background_image',
        'logo',
        'show_image',
        'image_fit',
        //Advanced
        'custom_css',
    ];

    protected $casts = [
        'show_product_name' => 'boolean',
        'show_price'        => 'boolean',
        'show_sku'          => 'boolean',
        'show_barcode'      => 'boolean',
        'show_qrcode'       => 'boolean',
        'show_image'        => 'boolean',
        'custom_css'        => 'array',
    ];

    
    //Accessor : Background Image URL
    public function getBackgroundImageUrlAttribute()
    {
        if (!$this->background_image) {
            return null;
        }

        return asset('storage/' . $this->background_image);
    }

    
    //Accessor : Logo URL
    public function getLogoUrlAttribute()
    {
        if (!$this->logo) {
            return null;
        }

        return asset('storage/' . $this->logo);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;

class AppSettingController extends Controller
{
   
    public function index()
    {
        $setting = AppSetting::first();
        if (!$setting) {
            $setting = AppSetting::create([]);
        }
        return response()->json([
            'success' => true,
            'data' => $setting,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([

            'auto_generate_barcode' => 'sometimes|boolean',
            'auto_detect_gtin' => 'sometimes|boolean',
            'allow_non_zero' => 'sometimes|boolean',

            'barcode_type' => 'nullable|string|max:255',
            'barcode_pattern' => 'nullable|string|max:255',
            'country_code' => 'nullable|string|max:20',
            'show_human_text' => 'sometimes|boolean',


            'auto_generate_sku' => 'sometimes|boolean',
            'sku_type' => 'nullable|string|max:100',
            'sku_length' => 'nullable|integer|min:1|max:50',
            'sku_prefix' => 'nullable|string|max:100',
            'sku_suffix' => 'nullable|string|max:100',
            'sku_pattern' => 'nullable|string|max:255',


            'printer_type' => 'nullable|string|max:100',
            'paper_size' => 'nullable|string|max:100',
            'paper_orientation' => 'nullable|string|max:100',

            'margin_top' => 'nullable|integer|min:0|max:100',
            'margin_left' => 'nullable|integer|min:0|max:100',

            'default_print_quantity' => 'nullable|integer|min:1',

            'show_barcode' => 'sometimes|boolean',
            'show_sku' => 'sometimes|boolean',
            'show_product_name' => 'sometimes|boolean',
            'show_price' => 'sometimes|boolean',

            'auto_print' => 'sometimes|boolean',


            'sync_stocky' => 'sometimes|boolean',


            'language' => 'nullable|string|max:20',


            'api_key' => 'nullable|string',
        ]);

        $setting = AppSetting::first();

        if (!$setting) {
            $setting = AppSetting::create([]);
        }

        $setting->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data' => $setting,
        ]);
    }
}
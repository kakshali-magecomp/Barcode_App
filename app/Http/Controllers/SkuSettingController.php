<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SkuSettingController extends Controller
{
    /**
     * Fetch existing SKU configuration records.
     */
    public function show()
    {
        $user = Auth::user();
        $skuSettings = $user->skuSetting()->firstOrCreate([]);
        
        return response()->json($skuSettings);
    }

    /**
     * Store or update SKU configuration records.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'sku_prefix'               => 'nullable|string|max:255',
            'sku_auto_number_start'    => 'nullable|string|max:255',
            'sku_suffix'               => 'nullable|string|max:255',
            'sku_delimiter'            => 'nullable|string|max:10',
            'segment_product_title'    => 'nullable|string',
            'segment_product_vendor'   => 'nullable|string',
            'segment_product_type'     => 'nullable|string',
            'segment_option1'          => 'nullable|string',
            'segment_option2'          => 'nullable|string',
            'segment_option3'          => 'nullable|string',
            'segment_metafields'       => 'nullable|string',
            'hide_options_1_2_3'       => 'required|boolean',
            'force_uppercase_fields'   => 'required|boolean',
        ]);

        $skuSettings = $user->skuSetting()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'data'    => $skuSettings
        ], 200);
    }
}

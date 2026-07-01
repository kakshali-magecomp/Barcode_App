<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Helpers\ShopifyQueryHelper;
use Illuminate\Support\Facades\Log;


class SkuSettingController extends Controller
{

    public function show()
    {
        $user = Auth::user();

        $setting = $user->skuSetting()->firstOrCreate([
            'user_id' => $user->id
        ]);

        return response()->json([
            'success' => true,
            'data' => $setting
        ]);
    }
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'sku_prefix' => 'nullable|string|max:255',
            'sku_auto_number_start' => 'nullable|string|max:255',
            'sku_suffix' => 'nullable|string|max:255',
            'sku_delimiter' => 'nullable|string|max:10',
            'segment_product_title' => 'nullable|string',
            'segment_product_vendor' => 'nullable|string',
            'segment_product_type' => 'nullable|string',
            'segment_option1' => 'nullable|string',
            'segment_option2' => 'nullable|string',
            'segment_option3' => 'nullable|string',
            'hide_options_1_2_3' => 'required|boolean',
            'force_uppercase_fields' => 'required|boolean',
        ]);

        $setting = $user->skuSetting()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        $this->generateSku();

        return response()->json([
            'success' => true,
            'message' => 'SKU settings saved successfully.'
        ]);
    }

    // NEW METHOD
    public function generateSku()
{
    $user = Auth::user();

    $setting = $user->skuSetting;

    if (!$setting) {
        return response()->json([
            "success" => false,
            "message" => "SKU settings not found."
        ], 404);
    }

    $query = ShopifyQueryHelper::showproduct();

    $response = $user->api()->graph($query);

    $products = json_decode(json_encode($response), true);

    $edges =
        $products['body']['container']['data']['products']['edges']
        ??
        $products['body']['data']['products']['edges']
        ??
        [];

    $counter = (int)$setting->sku_auto_number_start;

    foreach ($edges as $productEdge) {

        $product = $productEdge['node'];

        $productId = $product['id'];

        foreach ($product['variants']['edges'] as $variantEdge) {

            $variant = $variantEdge['node'];

            $sku = strtoupper(
                $setting->sku_prefix .
                $setting->sku_delimiter .
                substr(
                    preg_replace('/[^A-Za-z0-9]/', '', $product['title']),
                    0,
                    3
                ) .
                $setting->sku_delimiter .
                $counter .
                $setting->sku_delimiter .
                $setting->sku_suffix
            );

            $mutation = ShopifyQueryHelper::updateVariant();

            $variables = [
                "productId" => $productId,
                "variants" => [
                    [
                        "id" => $variant['id'],
                        "sku" => $sku
                    ]
                ]
            ];

            $result = $user->api()->graph($mutation, $variables);

            Log::info(json_encode($result, JSON_PRETTY_PRINT));

            $counter++;
        }
    }

    return response()->json([
        "success" => true,
        "message" => "SKU updated successfully."
    ]);
}
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Helpers\ShopifyQueryHelper;

class ShopifyProductController extends Controller
{
    public function list(Request $request)
    {
        try {
            $shop = Auth::user();

            if (!$shop) {
                return response()->json(["status" => 0, "error" => "Unauthenticated"], 401);
            }

            //  Fetch live product catalog via Helper GraphQL structure
            $query = ShopifyQueryHelper::showproduct();
            $rawResponse = $shop->api()->graph($query);
            $responseArray = json_decode(json_encode($rawResponse), true);

            //  Fetch the store's current custom SKU pattern profile layout rules
            $skuSettings = $shop->skuSetting()->firstOrCreate([]);

            $productsEdges = $responseArray['body']['container']['data']['products']['edges'] ??
                $responseArray['body']['data']['products']['edges'] ?? [];

            $flattenedVariants = [];

            // Flatten down the nodes structure into clean variants entries
            foreach ($productsEdges as $productEdge) {
                if (isset($productEdge['node'])) {
                    $product = $productEdge['node'];

                    foreach ($product['variants']['edges'] as $variantEdge) {
                        $variant = $variantEdge['node'];

                        // Extract option mapping arrays securely
                        $options = $variant['selectedOptions'] ?? [];

                        $flattenedVariants[] = [
                            'product_id' => $product['id'] ?? '',
                            'product_title' => $product['title'] ?? '',
                            'vendor' => $product['vendor'] ?? '',
                            'product_type' => $product['productType'] ?? '',
                            'variant_id' => $variant['id'] ?? '',
                            'variant_title' => $variant['title'] ?? '',
                            'current_sku' => $variant['sku'] ?? '',
                            'barcode' => $variant['barcode'] ?? '',
                            'price' => $variant['price'] ?? '0.00',
                            'image' => $product['featuredImage']['url'] ?? '',
                            'option_1' => $options[0]['value'] ?? '',
                            'option_2' => $options[1]['value'] ?? '',
                            'option_3' => $options[2]['value'] ?? '',
                        ];
                    }
                }
            }

            return response()->json([
                "status" => 1,
                "variants" => $flattenedVariants,
                "sku_rules" => $skuSettings // Send active pattern formulas to your frontend
            ]);

        } catch (\Exception $e) {
            return response()->json(["status" => 0, "error" => $e->getMessage()], 500);
        }
    }

    public function bulkUpdate(Request $request)
    {
        $request->validate([
            'variants' => 'required|array',
            'variants.*.variant_id' => 'required|string',
            'variants.*.suggested_sku' => 'required|string',
        ]);

        try {

            $shop = Auth::user();

            if (!$shop) {
                return response()->json([
                    "status" => 0,
                    "error" => "Unauthenticated"
                ], 401);
            }

            $mutation = ShopifyQueryHelper::updateVariant();

            $updated = 0;
            $failed = [];

            foreach ($request->variants as $variant) {

                $variables = [
                    "input" => [
                        "id" => $variant['variant_id'],
                        "sku" => $variant['suggested_sku']
                    ]
                ];

                $response = $shop->api()->graph($mutation, $variables);

                $result = json_decode(json_encode($response), true);

                Log::info(" SHOPIFY UPDATE RESPONSE ");
                Log::info(json_encode($result, JSON_PRETTY_PRINT));

                $data =
                    $result['body']['container']['data']['productVariantUpdate']
                    ?? $result['body']['data']['productVariantUpdate']
                    ?? null;

                if (!$data) {

                    $failed[] = [
                        "variant" => $variant['variant_id'],
                        "response" => $result
                    ];

                    continue;
                }

                $errors = $data['userErrors'] ?? [];

                if (!empty($errors)) {

                    Log::warning("Variant Update Failed", [
                        "variant" => $variant['variant_id'],
                        "errors" => $errors
                    ]);

                    $failed[] = [
                        "variant" => $variant['variant_id'],
                        "errors" => $errors
                    ];

                    continue;
                }

                Log::info("Updated Variant Successfully", [
                    "variant" => $variant['variant_id'],
                    "new_sku" => $variant['suggested_sku']
                ]);

                $updated++;
            }

            return response()->json([
                "status" => 1,
                "updated" => $updated,
                "failed" => $failed,
                "message" => "Bulk SKU update completed."
            ]);

        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                "status" => 0,
                "error" => $e->getMessage()
            ], 500);
        }
    }
    public function generateSku()
    {
        try {

            $shop = Auth::user();

            if (!$shop) {
                return response()->json([
                    "success" => false,
                    "message" => "Unauthenticated"
                ], 401);
            }

            // Get saved SKU settings
            $setting = $shop->skuSetting()->first();

            if (!$setting) {
                return response()->json([
                    "success" => false,
                    "message" => "SKU settings not found."
                ]);
            }

            // Fetch Shopify products
            $query = ShopifyQueryHelper::updateVariant();

            $response = $shop->api()->graph($query);

            $response = json_decode(json_encode($response), true);

            $products =
                $response['body']['container']['data']['products']['edges']
                ??
                $response['body']['data']['products']['edges']
                ??
                [];

            $variants = [];

            foreach ($products as $productEdge) {

                $product = $productEdge['node'];

                foreach ($product['variants']['edges'] as $variantEdge) {

                    $variant = $variantEdge['node'];

                    $newSku = $this->buildSku(
                        $product,
                        $variant,
                        $setting
                    );

                    $variants[] = [

                        "variant_id" => $variant['id'],

                        "product_title" => $product['title'],

                        "current_sku" => $variant['sku'],

                        "suggested_sku" => $newSku,

                        "price" => $variant['price'],

                        "image" => $product['featuredImage']['url'] ?? ""

                    ];
                }
            }

            return response()->json([
                "success" => true,
                "variants" => $variants
            ]);

        } catch (\Exception $e) {

            return response()->json([
                "success" => false,
                "message" => $e->getMessage()
            ], 500);

        }
    }
    private function buildSku($product,$variant,$setting)
{
    $delimiter = $setting->sku_delimiter ?: "-";

    $parts = [];

    if($setting->sku_prefix){
        $parts[] = $setting->sku_prefix;
    }

    if($setting->segment_product_title == "char_3"){
        $parts[] = strtoupper(substr(
            preg_replace('/[^A-Za-z0-9]/','',$product['title']),
            0,
            3
        ));
    }

    if($setting->segment_product_vendor == "char_2"){
        $parts[] = strtoupper(substr(
            preg_replace('/[^A-Za-z0-9]/','',$product['vendor']),
            0,
            2
        ));
    }

    if($setting->segment_product_type == "char_3"){
        $parts[] = strtoupper(substr(
            preg_replace('/[^A-Za-z0-9]/','',$product['productType']),
            0,
            3
        ));
    }

    $parts[] = $setting->sku_auto_number_start;

    if($setting->sku_suffix){
        $parts[] = $setting->sku_suffix;
    }

    return implode($delimiter,$parts);
}
}

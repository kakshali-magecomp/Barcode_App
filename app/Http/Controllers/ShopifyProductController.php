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

            $query = ShopifyQueryHelper::showproduct();
            $rawResponse = $shop->api()->graph($query);
            $responseArray = json_decode(json_encode($rawResponse), true);

            $skuSettings = $shop->skuSetting()->firstOrCreate([]);

            $productsEdges = $responseArray['body']['container']['data']['products']['edges'] ??
                $responseArray['body']['data']['products']['edges'] ?? [];

            $flattenedVariants = [];

            foreach ($productsEdges as $productEdge) {
                if (isset($productEdge['node'])) {
                    $product = $productEdge['node'];

                    foreach ($product['variants']['edges'] as $variantEdge) {
                        $variant = $variantEdge['node'];

                        // Extract option mapping arrays securely
                        $options = $variant['selectedOptions'] ?? [];

                        $productImage = isset($product['featuredImage']['url']) ? $product['featuredImage']['url'] : null;
                        $variantImage = isset($variant['image']['url']) ? $variant['image']['url'] : null;
                        $finalImage = $productImage ?? $variantImage ?? '';

                        // Find this section inside your variants iteration loop:
                        $flattenedVariants[] = [
                            'product_id' => $product['id'] ?? '',
                            'product_title' => $product['title'] ?? '',
                            'vendor' => $product['vendor'] ?? '',
                            'product_type' => $product['productType'] ?? '',

                            // ADDED: Forward store URLs and handles to your React frontend states
                            'online_url' => $product['onlineStoreUrl'] ?? '',
                            'handle' => $product['handle'] ?? '',

                            'variant_id' => $variant['id'] ?? '',
                            'variant_title' => $variant['title'] ?? '',
                            'current_sku' => $variant['sku'] ?? '',
                            'barcode' => $variant['barcode'] ?? '',
                            'price' => $variant['price'] ?? '0.00',
                            'image' => $finalImage,
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
                "sku_rules" => $skuSettings
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
                return response()->json(["status" => 0, "error" => "Unauthenticated"], 401);
            }

            $mutationQuery = ShopifyQueryHelper::updateVariant();
            $syncCount = 0;

            foreach ($request->variants as $item) {
                $variables = [
                    "input" => [
                        "id" => trim((string) $item['variant_id']),
                        "sku" => trim((string) $item['suggested_sku'])
                    ]
                ];

                // Fire mutation directly to Shopify cloud servers
                $response = $shop->api()->graph($mutationQuery, $variables);
                $resArray = json_decode(json_encode($response), true);

                $errors = $resArray['body']['container']['data']['productVariantUpdate']['userErrors'] ??
                    $resArray['body']['data']['productVariantUpdate']['userErrors'] ??
                    $resArray['data']['productVariantUpdate']['userErrors'] ?? [];

                if (empty($errors)) {
                    $syncCount++;
                } else {
                    Log::error("Shopify Write Rejected for Variant: " . $item['variant_id'], ['errors' => $errors]);
                }
            }

            return response()->json([
                "status" => 1,
                "message" => "Successfully synchronized {$syncCount} items directly onto your store catalog."
            ]);

        } catch (\Exception $e) {
            Log::error("BULK SYNC CRASH: " . $e->getMessage());
            return response()->json(["status" => 0, "error" => $e->getMessage()], 500);
        }
    }
}

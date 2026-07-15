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
                    $metafields = [];

                    foreach ($product['metafields']['edges'] ?? [] as $edge) {

                        $node = $edge['node'];

                        $metafields[$node['namespace'] . "." . $node['key']] = $node['value'];

                    }

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
                            'inventory_item_id' => $variant['inventoryItem']['id'] ?? '',
                            'product_title' => $product['title'] ?? '',
                            'vendor' => $product['vendor'] ?? '',
                            'product_type' => $product['productType'] ?? '',

                            // ADDED: Forward store URLs and handles to your React frontend states
                            'online_url' => "https://{$shop->name}/products/" . $product['handle'],
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

                            'metafields' => $metafields,

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
            'variants.*.inventory_item_id' => 'required|string',
            'variants.*.suggested_sku' => 'required|string',
        ]);

        try {

            Log::info('BULK UPDATE START');

            $shop = Auth::user();

            if (!$shop) {
                Log::error('User not authenticated.');
                return response()->json([
                    "status" => 0,
                    "error" => "Unauthenticated"
                ], 401);
            }

            Log::info('Authenticated User', [
                'user_id' => $shop->id,
                'shop' => $shop->name ?? '',
                'email' => $shop->email ?? ''
            ]);

            Log::info('Incoming Request', $request->all());

            $mutationQuery = ShopifyQueryHelper::updateInventoryItem();

            Log::info('GraphQL Mutation');
            Log::info($mutationQuery);

            $syncCount = 0;

            foreach ($request->variants as $index => $item) {

                Log::info(" VARIANT {$index} ");

                Log::info('Current Variant Data', $item);
                Log::info('Product ID', [
                    'product_id' => $item['product_id']
                ]);

                $variables = [
                    "id" => trim($item['inventory_item_id']),
                    "input" => [
                        "sku" => trim($item['suggested_sku']),
                    ]
                ];

                Log::info('GraphQL Variables', $variables);

                $response = $shop->api()->graph($mutationQuery, $variables);

                $responseArray = json_decode(json_encode($response), true);

                Log::info('Complete Shopify Response', $responseArray);

                $errors =
                    $responseArray['body']['container']['data']['inventoryItemUpdate']['userErrors']
                    ?? $responseArray['body']['data']['inventoryItemUpdate']['userErrors']
                    ?? $responseArray['body']['errors']
                    ?? $responseArray['errors']
                    ?? [];

                Log::info('Parsed Errors', [
                    'errors' => $errors
                ]);

                if (empty($errors)) {

                    $syncCount++;

                    Log::info('Variant Updated Successfully', [
                        'variant_id' => $item['variant_id'],
                        'sku' => $item['suggested_sku']
                    ]);

                } else {

                    Log::error('Variant Update Failed', [
                        'variant_id' => $item['variant_id'],
                        'sku' => $item['suggested_sku'],
                        'errors' => $errors
                    ]);
                }
            }

            Log::info(' BULK UPDATE FINISHED ');
            Log::info('Total Updated', [
                'count' => $syncCount
            ]);

            return response()->json([
                "status" => 1,
                "message" => "Successfully synchronized {$syncCount} items directly onto your store catalog."
            ]);

        } catch (\Exception $e) {

            Log::error(' BULK UPDATE EXCEPTION ');

            Log::error($e->getMessage());

            Log::error($e->getTraceAsString());

            return response()->json([
                "status" => 0,
                "error" => $e->getMessage()
            ], 500);
        }
    }
    public function bulkBarcodeUpdate(Request $request)
    {
        $request->validate([
            'product_id' => 'required|string', // MUST provide parent product GID
            'variants' => 'required|array',
            'variants.*.variant_id' => 'required|string',
            'variants.*.suggested_barcode' => 'required|string',
        ]);

        try {
            Log::info('BULK BARCODE UPDATE START');

            $shop = Auth::user();
            if (!$shop) {
                Log::error('User not authenticated.');
                return response()->json(["status" => 0, "error" => "Unauthenticated"], 401);
            }

            Log::info('Incoming Request', $request->all());

            // Prepare the variants collection for Shopify's expected structure
            $shopifyVariantsPayload = [];
            foreach ($request->variants as $item) {
                $shopifyVariantsPayload[] = [
                    "id" => trim($item['variant_id']),
                    "barcode" => trim($item['suggested_barcode'])
                ];
            }

            // Build the variables payload matching the GraphQL string definition
            $variables = [
                "productId" => trim($request->product_id), // maps to $productId
                "variants" => $shopifyVariantsPayload     // maps to $variants
            ];

            $mutationQuery = ShopifyQueryHelper::updateBarcode();

            Log::info('Sending GraphQL Bulk Mutation payload to Shopify');

            // Execute ONE single high-efficiency API request
            $response = $shop->api()->graph($mutationQuery, $variables);

            $responseArray = json_decode(json_encode($response), true);
            Log::info('Shopify Response', $responseArray);

            // Safe path resolution for userErrors inside productVariantsBulkUpdate
            $errors = $responseArray['body']['container']['data']['productVariantsBulkUpdate']['userErrors']
                ?? $responseArray['body']['data']['productVariantsBulkUpdate']['userErrors']
                ?? $responseArray['body']['errors']
                ?? $responseArray['errors']
                ?? [];

            if (!empty($errors)) {
                Log::error('Bulk Barcode Update Failed', ['errors' => $errors]);
                return response()->json([
                    "status" => 0,
                    "error" => "Shopify validation failed",
                    "details" => $errors
                ], 422);
            }

            Log::info("BULK BARCODE UPDATE FINISHED SUCCESSFULLY");

            return response()->json([
                "status" => 1,
                "message" => "Successfully synchronized product variant barcodes.",
            ]);

        } catch (\Exception $e) {
            Log::error('BULK BARCODE UPDATE EXCEPTION: ' . $e->getMessage());
            return response()->json([
                "status" => 0,
                "error" => $e->getMessage(),
            ], 500);
        }
    }

}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Helpers\ShopifyQueryHelper;
use App\Helpers\SkuGeneratorHelper;
use App\Helpers\BarcodeGeneratorHelper;

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
            'product_id' => 'required|string',
            'variants' => 'required|array',
        ]);

        try {

            Log::info("BARCODE GENERATION START");

            $shop = Auth::user();

            if (!$shop) {
                return response()->json([
                    "status" => 0,
                    "error" => "Unauthenticated"
                ], 401);
            }

            // Load barcode settings
            $barcodeSetting = $shop->barcodeSetting()->firstOrCreate([]);

            $shopifyVariantsPayload = [];
            $updatedProducts = [];

            foreach ($request->variants as $variant) {

                //generate barcode from helper file
                $barcode = BarcodeGeneratorHelper::generate(
                    $variant,
                    $barcodeSetting
                );

                if (empty($barcode)) {
                    continue;
                }

                $shopifyVariantsPayload[] = [
                    "id" => trim($variant["variant_id"]),
                    "barcode" => $barcode,
                ];

                $updatedProducts[] = [
                    "product_title" => $variant["product_title"] ?? "",
                    "variant_title" => $variant["variant_title"] ?? "",
                    "old_barcode" => $variant["barcode"] ?? "",
                    "new_barcode" => $barcode,
                ];
            }

            if (empty($shopifyVariantsPayload)) {

                return response()->json([
                    "status" => 0,
                    "error" => "No barcode generated."
                ], 422);

            }

            //shopify GRAPHQL
            $variables = [
                "productId" => trim($request->product_id),
                "variants" => $shopifyVariantsPayload,
            ];

            $mutation = ShopifyQueryHelper::updateBarcode();

            $response = $shop->api()->graph(
                $mutation,
                $variables
            );

            $responseArray = json_decode(
                json_encode($response),
                true
            );

            $errors =
                $responseArray['body']['container']['data']['productVariantsBulkUpdate']['userErrors']
                ??
                $responseArray['body']['data']['productVariantsBulkUpdate']['userErrors']
                ??
                [];

            if (!empty($errors)) {

                return response()->json([
                    "status" => 0,
                    "error" => "Shopify validation failed.",
                    "details" => $errors,
                ], 422);

            }

            Log::info("BARCODE GENERATION FINISHED");

            return response()->json([
                "status" => 1,
                "message" => count($updatedProducts) . " barcode generated successfully.",
                "updated_products" => $updatedProducts,
            ]);

        } catch (\Exception $e) {

            Log::error($e);

            return response()->json([
                "status" => 0,
                "error" => $e->getMessage(),
                "line" => $e->getLine(),
                "file" => $e->getFile(),
            ], 500);

        }
    }
    public function generateSku(Request $request)
    {
        $request->validate([
            'method' => 'required|string',
            'variants' => 'nullable|array',
        ]);

        try {

            $shop = Auth::user();
            if (!$shop) {
                return response()->json([
                    "status" => 0,
                    "error" => "Unauthenticated"
                ], 401);
            }
            $skuSetting = $shop->skuSetting()->firstOrCreate([]);
            $mutation = ShopifyQueryHelper::updateInventoryItem();
            $counter = (int) ($skuSetting->sku_auto_number_start ?? 1001);

            //variant list

            if ($request->input('method') === "missing") {
                $query = ShopifyQueryHelper::showproduct();
                $rawResponse = $shop->api()->graph($query);
                $responseArray = json_decode(json_encode($rawResponse), true);
                $productsEdges = $responseArray['body']['container']['data']['products']['edges'] ??
                    $responseArray['body']['data']['products']['edges'] ?? [];

                $variants = [];
                foreach ($productsEdges as $productEdge) {
                    $product = $productEdge['node'];
                    foreach ($product['variants']['edges'] as $variantEdge) {
                        $v = $variantEdge['node'];
                        // Skip variants which already have SKU
                        if (!empty($v['sku'])) {
                            continue;
                        }
                        $variants[] = [
                            "product_title" => $product["title"],
                            "vendor" => $product["vendor"] ?? "",
                            "product_type" => $product["productType"] ?? "",
                            "variant_title" => $v["title"],
                            "inventory_item_id" => $v["inventoryItem"]["id"],
                            "current_sku" => $v["sku"],
                            "barcode" => $v["barcode"] ?? "",
                            "option_1" => $v["selectedOptions"][0]["value"] ?? "",
                            "option_2" => $v["selectedOptions"][1]["value"] ?? "",
                            "option_3" => $v["selectedOptions"][2]["value"] ?? "",
                            "metafields" => $product["metafields"] ?? [],
                        ];
                    }
                }

            } else {
                // replace + barcode
                $variants = $request->variants ?? [];
            }

            //generate shopify
            $updatedProducts = [];
            foreach ($variants as $variant) {
                $currentSku = $variant['current_sku'] ?? "";
                // Barcode Mode
                if ($request->input('method') === "barcode") {
                    $newSku = trim($variant['barcode'] ?? '');
                    if ($newSku === '') {
                        continue;
                    }
                } else {
                    $newSku = SkuGeneratorHelper::generate(
                        $variant,
                        $skuSetting,
                        $counter,
                    );
                }

                if (empty($newSku)) {
                    continue;
                }

                //update shopify
                $variables = [
                    "id" => trim($variant["inventory_item_id"]),
                    "input" => [
                        "sku" => trim($newSku)
                    ]
                ];

                $response = $shop->api()->graph($mutation, $variables);
                $responseArray = json_decode(json_encode($response), true);
                $errors = $responseArray['body']['container']['data']['inventoryItemUpdate']['userErrors'] ??
                    $responseArray['body']['data']['inventoryItemUpdate']['userErrors'] ?? [];

                if (!empty($errors)) {
                    continue;
                }
                $updatedProducts[] = [
                    "product_title" => $variant["product_title"] ?? "",
                    "variant_title" => $variant["variant_title"] ?? "",
                    "old_sku" => $currentSku,
                    "new_sku" => $newSku,
                ];
            }

            //save counter
            if ($request->input('method') !== "barcode") {
                $skuSetting->sku_auto_number_start = $counter;
                $skuSetting->save();
            }

            return response()->json([
                "status" => 1,
                "message" => count($updatedProducts) . " SKU generated successfully.",
                "updated_products" => $updatedProducts,
            ]);

        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                "status" => 0,
                "error" => $e->getMessage(),
                "line" => $e->getLine(),
                "file" => $e->getFile(),
            ], 500);
        }
    }
    public function generateBarcode(Request $request)
    {
        $request->validate([
            'method' => 'required|string',
            'variants' => 'nullable|array',
        ]);

        try {

            $shop = Auth::user();

            if (!$shop) {
                return response()->json([
                    "status" => 0,
                    "error" => "Unauthenticated"
                ], 401);
            }

            $barcodeSetting = $shop->barcodeSetting()->firstOrCreate([]);

           //loard variant
            if ($request->input('method') == "missing") {
                $query = ShopifyQueryHelper::showproduct();
                $rawResponse = $shop->api()->graph($query);
                $responseArray = json_decode(
                    json_encode($rawResponse),
                    true
                );

                $productsEdges =
                    $responseArray['body']['container']['data']['products']['edges']??
                    $responseArray['body']['data']['products']['edges']??[];

                $variants = [];
                foreach ($productsEdges as $productEdge) {
                    $product = $productEdge["node"];
                    foreach ($product["variants"]["edges"] as $variantEdge) {
                        $v = $variantEdge["node"];
                        if (!empty($v["barcode"])) {
                            continue;
                        }
                        $variants[] = [
                            "product_id" => $product["id"],
                            "variant_id" => $v["id"],
                            "product_title" => $product["title"],
                            "vendor" => $product["vendor"],
                            "product_type" => $product["productType"],
                            "variant_title" => $v["title"],
                            "current_barcode" => $v["barcode"],
                            "current_sku" => $v["sku"],
                            "option_1" => $v["selectedOptions"][0]["value"] ?? "",
                            "option_2" => $v["selectedOptions"][1]["value"] ?? "",
                            "option_3" => $v["selectedOptions"][2]["value"] ?? "",
                            "metafields" => collect(
                                $product["metafields"]["edges"] ?? []
                            )->map(function ($edge) {
                                return [
                                    "namespace" => $edge["node"]["namespace"],
                                    "key" => $edge["node"]["key"],
                                    "value" => $edge["node"]["value"],
                                ];
                            })->toArray(),
                        ];
                    }
                }

            } else {
                $variants = $request->variants ?? [];
            }

           //generate barcode
            $groupedProducts = [];
            $updatedProducts = [];
            foreach ($variants as $variant) {
                $oldBarcode =$variant["barcode"]??
                    $variant["current_barcode"]??"";

               //barcode fro SKU
                if ($request->input('method') == "sku") {
                    $newBarcode = trim(
                        $variant["current_sku"] ?? ""
                    );
                    if ($newBarcode == "") {
                        continue;
                    }
                } else {
                    $newBarcode = BarcodeGeneratorHelper::generate($variant,$barcodeSetting);
                    if (empty($newBarcode)) {
                        continue;
                    }
                }

               //gropu by product
                $groupedProducts[$variant["product_id"]][] = [
                    "id" => $variant["variant_id"],
                    "barcode" => $newBarcode,
                ];

                $updatedProducts[] = [
                    "product_title" => $variant["product_title"],
                    "variant_title" => $variant["variant_title"],
                    "old_barcode" => $oldBarcode,
                    "new_barcode" => $newBarcode,
                ];
            }

            //shopify bulkupdate
            $mutation = ShopifyQueryHelper::updateBarcode();
            foreach ($groupedProducts as $productId => $shopifyVariants) {
                $variables = ["productId" => $productId, "variants" => $shopifyVariants,];
                $response = $shop->api()->graph($mutation, $variables);
                $responseArray = json_decode(json_encode($response), true);
                $errors = $responseArray['body']['container']['data']['productVariantsBulkUpdate']['userErrors'] ??
                    $responseArray['body']['data']['productVariantsBulkUpdate']['userErrors'] ?? [];

                if (!empty($errors)) {
                    Log::error($errors);
                }
            }

            return response()->json([
                "status" => 1,
                "message" => count($updatedProducts) . " barcode generated successfully.",
                "updated_products" => $updatedProducts,

            ]);

        } catch (\Exception $e) {

            Log::error($e);
            return response()->json([
                "status" => 0,
                "error" => $e->getMessage(),
                "line" => $e->getLine(),
                "file" => $e->getFile(),
            ], 500);
        }
    }
    
}
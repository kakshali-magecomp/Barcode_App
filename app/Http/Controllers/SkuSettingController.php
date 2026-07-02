<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Helpers\ShopifyQueryHelper;

class SkuSettingController extends Controller
{

    public function show()
    {
        $user = Auth::user();
        $sku = $user->skuSetting()->firstOrCreate([]);
        return response()->json($sku);
    }


    public function update(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated session.'], 401);
        }

        //Validate incoming criteria parameters from your React settings form
        $validated = $request->validate([
            'sku_prefix' => 'nullable|string|max:255',
            'sku_auto_number_start' => 'nullable|string|max:255',
            'sku_suffix' => 'nullable|string|max:255',
            'sku_delimiter' => 'nullable|string|max:10',
            'segment_product_title' => 'required|string',
            'segment_product_vendor' => 'required|string',
            'segment_product_type' => 'required|string',
            'segment_option1' => 'required|string',
            'segment_option2' => 'required|string',
            'segment_option3' => 'required|string',
            'segment_metafields' => 'required|string',
            'hide_options_1_2_3' => 'required|boolean',
            'force_uppercase_fields' => 'required|boolean',
        ]);

        //  Commit the new pattern formula values directly to your local mysql table
        $skuSettings = $user->skuSetting()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        Log::info("AUTO-SYNC TRIGGERED FROM SETTINGS SAVE FOR SHOP ID: " . $user->id);

        try {
            // Fetch all active variations from Shopify via your query helper class
            $listQuery = ShopifyQueryHelper::showproduct();
            $rawResponse = $user->api()->graph($listQuery);
            $responseArray = json_decode(json_encode($rawResponse), true);

            $productsEdges = $responseArray['body']['container']['data']['products']['edges'] ??
                $responseArray['body']['data']['products']['edges'] ?? [];

            $mutationQuery = ShopifyQueryHelper::updateVariant();
            $syncCount = 0;

            //  Overwrite Loop: Calculate and update variants immediately on Shopify
            foreach ($productsEdges as $productEdge) {
                if (!isset($productEdge['node']))
                    continue;
                $product = $productEdge['node'];

                foreach ($product['variants']['edges'] as $variantEdge) {
                    if (!isset($variantEdge['node']))
                        continue;
                    $variant = $variantEdge['node'];

                    // FIXED: Extract variable values safely out of the sequential objects array list
                    $optionsList = $variant['selectedOptions'] ?? [];
                    $opt1 = isset($optionsList[0]['value']) ? $optionsList[0]['value'] : '';
                    $opt2 = isset($optionsList[1]['value']) ? $optionsList[1]['value'] : '';
                    $opt3 = isset($optionsList[2]['value']) ? $optionsList[2]['value'] : '';

                    // Build the new SKU string based on your updated settings model parameters
                    $newSku = $this->compileSkuString($product, $skuSettings, $opt1, $opt2, $opt3);

                    // Skip the API call if the SKU matches to save network bandwidth credits
                    if ($variant['sku'] === $newSku) {
                        continue;
                    }

                    $variables = [
                        "input" => [
                            "id" => $variant['id'],
                            "sku" => (string) $newSku
                        ]
                    ];

                    // Fire GraphQL Mutation directly to Shopify's live cloud server
                    $user->api()->graph($mutationQuery, $variables);
                    $syncCount++;

                    // Throttling switch to ensure compliance with Shopify API Leaky Bucket limits
                    usleep(40000);
                }
            }


            return response()->json([
                'success' => true,
                'message' => "Settings applied! Automatically updated {$syncCount} product variant SKUs across your live store.",
                'data' => $skuSettings
            ], 200);

        } catch (\Exception $e) {
            Log::error("AUTOMATED SKU UPDATE FAIL: " . $e->getMessage());
            return response()->json([
                'success' => true, // Still true because configurations saved successfully in database
                'message' => 'Settings stored locally, but live store sync failed: ' . $e->getMessage(),
                'data' => $skuSettings
            ], 200);
        }
    }


    private function compileSkuString($product, $rules, $o1, $o2, $o3)
    {
        $delimiter = $rules->sku_delimiter ?? '-';
        $segments = [];

        if ($rules->sku_prefix) {
            $segments[] = $rules->sku_prefix;
        }

        $parse = function ($text, $mode) {
            if (!$mode || $mode === 'none' || $mode === 'disabled')
                return null;
            if ($mode === 'full')
                return $text;
            if ($mode === 'char_1')
                return substr($text, 0, 1);
            if ($mode === 'char_2')
                return substr($text, 0, 2);
            if ($mode === 'char_3')
                return substr($text, 0, 3);
            if ($mode === 'char_4')
                return substr($text, 0, 4);
            return null;
        };

        if ($p = $parse($product['title'] ?? '', $rules->segment_product_title))
            $segments[] = $p;
        if ($p = $parse($product['vendor'] ?? '', $rules->segment_product_vendor))
            $segments[] = $p;
        if ($p = $parse($product['productType'] ?? '', $rules->segment_product_type))
            $segments[] = $p;

        if (!$rules->hide_options_1_2_3) {
            if ($p = $parse($o1, $rules->segment_option1))
                $segments[] = $p;
            if ($p = $parse($o2, $rules->segment_option2))
                $segments[] = $p;
            if ($p = $parse($o3, $rules->segment_option3))
                $segments[] = $p;
        }

        $segments[] = $rules->sku_auto_number_start ?? '1001';

        if ($rules->sku_suffix) {
            $segments[] = $rules->sku_suffix;
        }

        $finalStr = str_replace(' ', '', implode($delimiter, $segments));
        return $rules->force_uppercase_fields ? strtoupper($finalStr) : $finalStr;
    }
}

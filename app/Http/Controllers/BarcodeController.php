<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BarcodeController extends Controller
{
    /**
     * Generate Barcode / SKU / Print
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'template_id' => 'required',
            'method' => 'required|string',
            'products' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {

            $generatedProducts = [];

            foreach ($request->input('products', []) as $product) {

                $generatedProducts[] = [
                    'product_id' => data_get($product, 'id'),
                    'title' => data_get($product, 'title'),
                    'barcode' => rand(100000000000, 999999999999),
                    'sku' => 'SKU-' . rand(1000, 9999),
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Barcode generated successfully',
                'data' => [
                    'template_id' => $request->template_id,
                    'method' => $request->method,
                    'total_products' => count($generatedProducts),
                    'generated_at' => now()->format('Y-m-d H:i:s'),
                    'products' => $generatedProducts,
                ],
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);

        }
    }

    /**
     * Generate History
     */
    public function generateHistory()
    {
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'id' => 1,
                    'action' => 'Generate Barcode',
                    'template' => 'Default Template',
                    'products' => 5,
                    'created_at' => now()->subDays(1)->format('Y-m-d H:i:s'),
                ],
                [
                    'id' => 2,
                    'action' => 'Generate SKU',
                    'template' => 'Price Label',
                    'products' => 3,
                    'created_at' => now()->format('Y-m-d H:i:s'),
                ],
            ],
        ]);
    }

    /**
     * Print History
     */
    public function printHistory()
    {
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'id' => 1,
                    'template' => 'Default Template',
                    'products' => 10,
                    'printed_at' => now()->subHours(3)->format('Y-m-d H:i:s'),
                ],
            ],
        ]);
    }
}
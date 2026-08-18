<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\GenerateBarcodeJob;
use App\Jobs\GenerateSkuJob;
use Log;

class ProductWebhookController extends Controller
{
    public function created(Request $request)
    {
        Log::info('ProductWebhookController call');

        $shop = $request->header('X-Shopify-Shop-Domain');
        $product = $request->all();

        GenerateBarcodeJob::dispatch($shop, $product);
        GenerateSkuJob::dispatch($shop, $product);

        return response()->json([
            'success' => true,
        ]);
    }
}
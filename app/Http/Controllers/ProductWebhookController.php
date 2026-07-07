<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductWebhookController extends Controller
{
    public function created(Request $request)
    {
        try {

            $payload = $request->json()->all();

            Log::info("PRODUCTS_CREATE WEBHOOK");

            Log::info('Product Details', [
                'Product ID' => $payload['id'] ?? null,
                'Title' => $payload['title'] ?? null,
                'Handle' => $payload['handle'] ?? null,
                'Vendor' => $payload['vendor'] ?? null,
            ]);

            Log::info('Full Payload', $payload);

            return response()->json([
                'success' => true,
            ], 200);

        } catch (\Exception $e) {

            Log::error('Webhook Error');

            Log::error($e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
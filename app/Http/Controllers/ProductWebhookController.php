<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\GenerateBarcodeJob;

class ProductWebhookController extends Controller
{
    public function created(Request $request)
    {
        GenerateBarcodeJob::dispatch([
            'shop'    => $request->header('X-Shopify-Shop-Domain'),
            'product' => $request->all(),
        ]);

        return response()->json([
            'success' => true,
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Jobs\GenerateBarcodeJob;
use Log;

class ProductWebhookController extends Controller
{
    public function created(Request $request)
    {
        Log::info('ProductWebhookController call');
        GenerateBarcodeJob::dispatch(
            $request->header('X-Shopify-Shop-Domain'),
            $request->all()
        );
         
        return response()->json([
            'success' => true,
        ]);
    }
}
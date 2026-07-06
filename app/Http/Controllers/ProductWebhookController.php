<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductWebhookController extends Controller
{
    public function created(Request $request)
    {
        $payload = $request->all();

        Log::info('-----------------------------');
        Log::info('PRODUCT CREATE WEBHOOK');
        Log::info($payload);
        Log::info('-----------------------------');

        return response()->json([
            'success' => true
        ]);
    }
}
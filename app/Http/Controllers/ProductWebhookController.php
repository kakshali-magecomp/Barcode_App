<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductWebhookController extends Controller
{
    public function created(Request $request)
    {
        Log::info('PRODUCT CREATED');
        Log::info($request->all());

        return response()->json([
            'success' => true
        ]);
    }
}
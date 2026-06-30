<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BarcodeSettingController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        $barcodeSettings = $user->barcodeSetting()->firstOrCreate([]);
        return response()->json($barcodeSettings);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'auto_generate_on_create' => 'required|boolean',
            'auto_detect_gtin_format' => 'required|boolean',
            'prevent_zero_start_end'  => 'required|boolean',
            'barcode_format'          => 'required|string|max:50',
            'barcode_pattern'         => 'nullable|string|max:255',
            'contextual_pricing_value'=> 'nullable|string|max:255',
        ]);

        $barcodeSettings = $user->barcodeSetting()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'data'    => $barcodeSettings
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
     public function index()
    {
        $setting = Setting::first();

        if (!$setting) {

            $setting = Setting::create([
                'settings' => [
                    'barcode' => [
                        'type' => 'CODE128',
                        'width' => 2,
                        'height' => 80,
                        'showText' => true,
                    ],

                    'printing' => [
                        'paper' => 'A4',
                        'margin' => 10,
                        'padding' => 5,
                    ],

                    'sku' => [
                        'prefix' => '',
                        'separator' => '-',
                        'length' => 6,
                    ],

                    'translation' => [
                        'language' => 'en',
                    ],

                    'api' => [
                        'token' => '',
                    ],
                ]
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $setting->settings,
        ]);
    }

    /**
     * Save settings
     */
    public function update(Request $request)
    {
        $setting = Setting::first();

        if (!$setting) {
            $setting = Setting::create([
                'settings' => []
            ]);
        }

        $setting->settings = array_merge(
            $setting->settings ?? [],
            $request->all()
        );

        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully.',
            'data' => $setting->settings,
        ]);
    }
}

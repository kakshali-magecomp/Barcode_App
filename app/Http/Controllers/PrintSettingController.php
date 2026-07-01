<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PrintSettingController extends Controller
{
   
    public function show()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized shop session context.'
                ], 401);
            }

            // Fetch current settings or instantiate an empty array default entry profile
            $printSettings = $user->printSetting()->firstOrCreate([]);

            // Fetch all templates built by this merchant to feed the layout selectors
            $templates = $user->barcodeTemplates()->get(['id', 'template_name']);

            return response()->json([
                'success'   => true,
                'settings'  => $printSettings,
                'templates' => $templates
            ], 200);

        } catch (\Exception $e) {
            Log::error('PRINT SETTINGS FETCH FAILURE', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

        public function update(Request $request)
{
    try {
        $user = Auth::user();

        // Validate all incoming attributes parameters
        $validated = $request->validate([
            'price_decimal_number'         => 'required|integer|min:0|max:4',
            'currency_format'              => 'required|string',
            'default_print_template_id'    => 'nullable|integer',
            'default_generate_option'      => 'required|string',
            'default_print_label_quantity' => 'required|integer|min:1',
            'vat_percentage'               => 'required|numeric|min:0|max:100',
            'sort_by_sku'                  => 'required|boolean',
            
            // ADDED: Validate the 3 new checkboxes arriving from React
            'hide_product_draft'           => 'required|boolean',
            'hide_product_archived'        => 'required|boolean',
            'use_shopify_flow_action'      => 'required|boolean',
            
            // Keep hidden fallbacks safe so database constraints don't fail
            'print_mode'                   => 'nullable|string',
            'rotate_180'                   => 'nullable|boolean',
            'label_width'                  => 'nullable|integer',
            'label_height'                 => 'nullable|integer',
            'margin_top'                   => 'nullable|integer',
            'margin_left'                  => 'nullable|integer',
        ]);

        // Merge baseline defaults for hidden hardware columns if they are omitted from the frontend form
        $validated['print_mode'] = $validated['print_mode'] ?? 'dialog';
        $validated['rotate_180'] = $validated['rotate_180'] ?? false;
        $validated['label_width'] = $validated['label_width'] ?? 32;
        $validated['label_height'] = $validated['label_height'] ?? 19;
        $validated['margin_top'] = $validated['margin_top'] ?? 0;
        $validated['margin_left'] = $validated['margin_left'] ?? 0;

        $updatedSettings = $user->printSetting()->updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Printing rules configurations updated successfully!',
            'data'    => $updatedSettings
        ], 200);

    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

}

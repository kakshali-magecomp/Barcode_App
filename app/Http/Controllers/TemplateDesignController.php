<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\BarcodeTemplate;
use App\Models\TemplateDesign;

class TemplateDesignController extends Controller
{
   
    public function show($template_id)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            // Verify template owner security scope parameters
            $template = $user->barcodeTemplates()->findOrFail($template_id);

            // Fetch or instantly initialize the relational rows with safe defaults
            $design = TemplateDesign::firstOrCreate(
                ['barcode_template_id' => $template->id],
                [
                    'margin_top' => 5, 'margin_bottom' => 5, 'margin_left' => 5, 'margin_right' => 5,
                    'line1_sku' => true, 'line2_name' => true, 'line2_price' => true, 'line2_currency_format' => '${{amount}}',
                    'line2_show_price_per_unit' => false, 'line2_variant_option1' => true, 'line3_vendor' => false,
                    'symbol_enabled' => true, 'symbol_type' => 'QR', 'symbol_color' => '#000000',
                    'symbol_field_source' => 'barcode_value', 'hide_barcode_value' => false,
                    'symbol_font_size' => 12, 'symbol_bar_width' => 2, 'symbol_bar_height' => 35,
                    'symbol_width_px' => '140', 'symbol_margin_px' => '1',
                    'qr_dot_type' => 'square', 'qr_corner_dot_type' => 'square', 'qr_corner_square_type' => 'square',
                    'print_qty' => 1
                ]
            );

            // Merge template properties for the React state payload
            $responsePayload = array_merge($design->toArray(), [
                'template_name' => $template->template_name
            ]);

            return response()->json([
                'success' => true,
                'data'    => $responsePayload
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    
    public function update(Request $request, $template_id)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            $template = $user->barcodeTemplates()->findOrFail($template_id);
            
            // FIXED: Intercept nested design objects to avoid saving blank fallback metrics over your records
            $incoming = $request->has('design') ? $request->input('design') : $request->all();

            // Enforce explicit database type constraints
            $fieldsPayload = [
                'margin_top'                => (int)($incoming['margin_top'] ?? 5),
                'margin_bottom'             => (int)($incoming['margin_bottom'] ?? 5),
                'margin_left'               => (int)($incoming['margin_left'] ?? 5),
                'margin_right'              => (int)($incoming['margin_right'] ?? 5),
                'line1_sku'                 => filter_var($incoming['line1_sku'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'line2_name'                => filter_var($incoming['line2_name'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'line2_price'               => filter_var($incoming['line2_price'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'line2_currency_format'     => (string)($incoming['line2_currency_format'] ?? '${{amount}}'),
                'line2_show_price_per_unit' => filter_var($incoming['line2_show_price_per_unit'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'line2_variant_option1'     => filter_var($incoming['line2_variant_option1'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'line3_vendor'              => filter_var($incoming['line3_vendor'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'symbol_enabled'            => filter_var($incoming['symbol_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'symbol_type'               => (string)($incoming['symbol_type'] ?? 'QR'),
                'symbol_color'              => (string)($incoming['symbol_color'] ?? '#000000'),
                'symbol_logo_filename'      => (string)($incoming['symbol_logo_filename'] ?? ''),
                'symbol_field_source'       => (string)($incoming['symbol_field_source'] ?? 'barcode_value'),
                'hide_barcode_value'        => filter_var($incoming['hide_barcode_value'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'symbol_font_size'          => (int)($incoming['symbol_font_size'] ?? 12),
                'symbol_bar_width'          => (int)($incoming['symbol_bar_width'] ?? 2),
                'symbol_bar_height'         => (int)($incoming['symbol_bar_height'] ?? 35),
                'symbol_width_px'           => (string)($incoming['symbol_width_px'] ?? '140'),
                'symbol_margin_px'          => (string)($incoming['symbol_margin_px'] ?? '1'),
                'qr_dot_type'               => (string)($incoming['qr_dot_type'] ?? 'square'),
                'qr_corner_dot_type'        => (string)($incoming['qr_corner_dot_type'] ?? 'square'),
                'qr_corner_square_type'     => (string)($incoming['qr_corner_square_type'] ?? 'square'),
                'print_qty'                 => (int)($incoming['print_qty'] ?? 1),
            ];

            // Update column settings if record matches or insert an active row if empty
            $design = TemplateDesign::updateOrCreate(
                ['barcode_template_id' => $template->id],
                $fieldsPayload
            );

            return response()->json([
                'success' => true,
                'message' => 'Design layout columns committed successfully!',
                'data'    => $design
            ], 200);

        } catch (\Exception $e) {
            Log::error("Design Save Failure: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}

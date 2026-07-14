<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\BarcodeTemplate;
use App\Models\LabelHistory;
use Picqer\Barcode\BarcodeGeneratorPNG;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class BarcodePrintController extends Controller
{

    public function printToPdf(Request $request)
    {
        ini_set('memory_limit', '256M');

        $request->validate([
            'template_id' => 'required|string',
            'variant_id' => 'required|string',

            'product_title' => 'required|string',
            'sku' => 'nullable|string',
            'barcode' => 'nullable|string',
            'online_url' => 'nullable|string',

            'price' => 'nullable|string',
            'vendor' => 'nullable|string',
            'option_1' => 'nullable|string',

            'print_qty' => 'required|integer|min:1',

            'design' => 'required|array',
        ]);
        $design = $request->input('design');
        $qty = (int) $request->input('print_qty');
        $fieldSource = $design['symbol_field_source'] ?? 'sku_value';

        switch ($fieldSource) {

            case 'product_name':
                $symbolValue = $request->input('product_title');
                break;

            case 'product_price':
                $symbolValue = $request->input('price');
                break;

            case 'product_online_url':
                $symbolValue = $request->input('online_url');
                break;

            case 'barcode_value':
                $symbolValue = $request->input('barcode');
                break;

            case 'sku_value':
            default:
                $symbolValue = $request->input('sku');
                break;
        }

        $symbolValue = trim((string) $symbolValue);

        if ($symbolValue === '') {
            $symbolValue = 'EMPTY';
        }

        $renderedSymbolHtml = '';
        list($r, $g, $b) = sscanf($design['symbol_color'] ?? '#000000', "#%02x%02x%02x");

        if (!empty($design['symbol_enabled'])) {
            if (($design['symbol_type'] ?? 'QR') === 'BARCODE') {
                
                $generator = new BarcodeGeneratorPNG();
                $widthMultiplier = isset($design['symbol_bar_width']) ? (int) $design['symbol_bar_width'] : 2;
                $heightMm = isset($design['symbol_bar_height']) ? (int) $design['symbol_bar_height'] : 30;

                $barcodeBase64 = base64_encode(
                    $generator->getBarcode($symbolValue, $generator::TYPE_CODE_128, $widthMultiplier, $heightMm, [$r, $g, $b])
                );
                $renderedSymbolHtml = '<img src="data:image/png;base64,' . $barcodeBase64 . '" style="width: 140px; height: auto; display: block; margin: 0 auto;" />';
            } else {
                $qrWidth = isset($design['symbol_width_px']) && !empty($design['symbol_width_px']) ? (int) $design['symbol_width_px'] : 120;

                // Pure vector strings converted to clean base64 image strings to shield the DOMPDF parser
                $rawSvgString = QrCode::size($qrWidth)
                    ->color($r, $g, $b)
                    ->backgroundColor(255, 255, 255)
                    ->margin(1)
                    ->generate($symbolValue);

                $cleanSvg = str_replace('<?xml version="1.0" encoding="UTF-8"?>', '', (string) $rawSvgString);
                $svgBase64 = base64_encode($cleanSvg);

                $renderedSymbolHtml = '<img src="data:image/svg+xml;base64,' . $svgBase64 . '" style="width: ' . $qrWidth . 'px; height: auto; display: block; margin: 0 auto;" />';
            }
        }

        $htmlMarkup = '
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
            <style>
                @page { 
                    margin: 0px; 
                }
                body { 
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #ffffff;
                }
                .label-sticker-grid-cell {
                    display: block;
                    box-sizing: border-box;
                    text-align: center;
                    padding: ' . ($design['margin_top'] ?? 5) . 'mm ' . ($design['margin_right'] ?? 5) . 'mm ' . ($design['margin_bottom'] ?? 5) . 'mm ' . ($design['margin_left'] ?? 5) . 'mm;
                    width: 100%;
                    page-break-after: always;
                }
                .text-sku { font-family: monospace; font-weight: bold; font-size: 12px; margin-bottom: 2px; color: #1a1a1a; }
                .text-title-row { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
                .text-vendor { font-size: 10px; color: #6d7175; text-transform: uppercase; margin-top: 1px; }
                .symbol-wrapper { margin-top: 6px; margin-bottom: 4px; display: block; text-align: center; }
            </style>
        </head>
        <body>';

        for ($i = 0; $i < $qty; $i++) {
            $htmlMarkup .= '<div class="label-sticker-grid-cell">';

            if (!empty($design['line1_sku'])) {
                $htmlMarkup .= '<div class="text-sku">' . htmlspecialchars($request->sku) . '</div>';
            }

            $htmlMarkup .= '<div class="text-title-row">';
            if (!empty($design['line2_name'])) {
                $htmlMarkup .= htmlspecialchars($request->input('product_title')) . ' ';
            }
            if (!empty($design['line2_variant_option1']) && !empty($request->input('option_1'))) {
                $htmlMarkup .= '— ' . htmlspecialchars($request->input('option_1')) . ' ';
            }
            if (!empty($design['line2_price'])) {
                $formattedPrice = ($design['line2_currency_format'] ?? '${{amount}}') === '${{amount}}' ? '$' . $request->input('price') : $request->input('price');
                $htmlMarkup .= '<span style="color:#108043;">| ' . htmlspecialchars($formattedPrice) . '</span>';
            }
            $htmlMarkup .= '</div>';

            if (!empty($design['line3_vendor']) && !empty($request->input('vendor'))) {
                $htmlMarkup .= '<div class="text-vendor">' . htmlspecialchars($request->input('vendor')) . '</div>';
            }

            if (!empty($design['symbol_enabled'])) {
                $htmlMarkup .= '<div class="symbol-wrapper">' . $renderedSymbolHtml . '</div>';
            }

            $htmlMarkup .= '</div>';
        }

        $htmlMarkup .= '</body></html>';

        $pdf = Pdf::loadHTML($htmlMarkup);
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }


        LabelHistory::create([
            'user_id' => $user->id,
            'barcode_template_id' => $request->template_id,
            'variant_id' => $request->variant_id,
            'product_title' => $request->product_title,
            'sku' => $request->sku,
            'price' => $request->price,
            'vendor' => $request->vendor,
            'quantity' => $qty,
            'printed_at' => now(),
        ]);
        return $pdf->download('barcode_labels_sheet_' . $request->input('template_id') . '.pdf');
    }
}

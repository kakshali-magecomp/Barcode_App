<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Template;

class TemplateController extends Controller
{
    /**
     * Get all templates
     */
    public function index()
    {
        try {

            $templates = Template::latest()->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);

        }
    }

    /**
     * Create template
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        try {

            $template = Template::create([
                'name' => $request->name,
                'description' => $request->description,
                'note' => $request->note,

                'paper_brand' => $request->paper_brand,
                'paper_model' => $request->paper_model,
                'paper_size' => $request->paper_size,

                'template_type' => $request->template_type,

                'label_width' => $request->label_width,
                'label_height' => $request->label_height,

                'padding_top' => $request->padding_top,
                'padding_bottom' => $request->padding_bottom,
                'padding_left' => $request->padding_left,
                'padding_right' => $request->padding_right,

                'margin_top' => $request->margin_top,
                'margin_bottom' => $request->margin_bottom,
                'margin_left' => $request->margin_left,
                'margin_right' => $request->margin_right,

                'show_product_name' => $request->show_product_name,
                'show_price' => $request->show_price,
                'show_sku' => $request->show_sku,
                'show_barcode' => $request->show_barcode,
                'show_qrcode' => $request->show_qrcode,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => $template
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);

        }
    }
    public function destroyMultiple(Request $request)
    {
        try {

            Template::whereIn(
                'id',
                $request->ids
            )->delete();

            return response()->json([
                'success' => true,
                'message' => 'Templates deleted successfully'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    public function deleteTemplates(Request $request)
{
    try {

        Template::whereIn(
            'id',
            $request->ids
        )->delete();

        return response()->json([
            'success' => true,
            'message' => 'Templates deleted successfully'
        ]);

    } catch (\Exception $e) {

        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}
}
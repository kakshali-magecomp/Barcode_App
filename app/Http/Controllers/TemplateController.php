<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Template;
use Illuminate\Support\Facades\Storage;

class TemplateController extends Controller
{
    //get all tamplate
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

    //create tamplate
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'template_type' => 'required|in:barcode,image',
            'template_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        try {

            $imagePath = null;

            if (
                $request->template_type === 'image' &&
                $request->hasFile('template_image')
            ) {

                $imagePath = $request
                    ->file('template_image')
                    ->store('template-images', 'public');
            }

            $template = Template::create([
                'name' => $request->name,
                'description' => $request->description,
                'note' => $request->note,

                'paper_brand' => $request->paper_brand,
                'paper_model' => $request->paper_model,
                'paper_size' => $request->paper_size,

                'template_type' => $request->template_type,
                'template_image' => $imagePath,

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

                'show_product_name' => $request->boolean('show_product_name'),
                'show_price' => $request->boolean('show_price'),
                'show_sku' => $request->boolean('show_sku'),
                'show_barcode' => $request->boolean('show_barcode'),
                'show_qrcode' => $request->boolean('show_qrcode'),

                'custom_css' => $request->custom_css,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully',
                'data' => $template,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    //delete selected template
    public function deleteTemplates(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
        ]);

        try {

            $templates = Template::whereIn('id', $request->ids)->get();

            foreach ($templates as $template) {

                if (
                    $template->template_image &&
                    Storage::disk('public')->exists($template->template_image)
                ) {
                    Storage::disk('public')->delete($template->template_image);
                }

                $template->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Templates deleted successfully',
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    //alise
    public function destroyMultiple(Request $request)
    {
        return $this->deleteTemplates($request);
    }
}
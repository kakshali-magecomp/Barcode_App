<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BarcodeTemplateController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'template_name'   => 'required|string|max:255',
            'description'     => 'nullable|string',
            'note'            => 'nullable|string',
            'paper_brand'     => 'nullable|string|max:255',
            'paper_model'     => 'nullable|string|max:255',
            'layout_settings' => 'nullable|array',
        ]);

        $user = Auth()->user();

        $template = $user->barcodeTemplates()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Template save sauccessfully!',
            'data' => $template
        ],201);
    }
}

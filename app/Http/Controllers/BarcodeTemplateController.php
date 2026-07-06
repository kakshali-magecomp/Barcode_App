<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class BarcodeTemplateController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.'
                ], 401);
            }

            $templates = $user->barcodeTemplates()->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ], 200);

        } catch (\Exception $e) {
            Log::error('BARCODE TEMPLATE INDEX CRASH: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {

            Log::info('CREATE TEMPLATE ');
            Log::info($request->all());

            $validated = $request->validate([
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'note' => 'nullable|string',
                'paper_brand' => 'required|string|max:255',
                'paper_model' => 'required|string|max:255',
                'layout_settings' => 'required|array',
            ]);

            $user = Auth::user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.'
                ], 401);
            }

            $template = $user->barcodeTemplates()->create([

                'template_name' => $validated['template_name'],
                'description' => $validated['description'] ?? null,
                'note' => $validated['note'] ?? null,

                'paper_brand' => $validated['paper_brand'],
                'paper_model' => $validated['paper_model'],

                'layout_settings' => $validated['layout_settings']

            ]);

            Log::info('Template Created', [
                'id' => $template->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully.',
                'data' => $template
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            Log::error('BARCODE TEMPLATE STORE ERROR');
            Log::error($e->getMessage());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);

        }
    }


    public function show($id)
    {
        try {
            $user = Auth::user();

            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            // ADDED FOR VISIBILITY TRACING: Log parameters to storage/logs/laravel.log
            Log::info("Attempting template fetch lookup trace", [
                'authenticated_user_id' => $user->id,
                'requested_template_id' => $id
            ]);

            // Query the item explicitly
            $template = $user->barcodeTemplates()->find($id);

            if (!$template) {
                // Check if the item exists under another user to pinpoint cross-shop leakage bugs
                $globalCheck = \App\Models\BarcodeTemplate::find($id);

                if ($globalCheck) {
                    Log::warning("Mismatched Owner Conflict: Template ID {$id} exists but belongs to Shop ID: " . $globalCheck->user_id);
                    return response()->json([
                        'success' => false,
                        'message' => "Ownership boundary protection block. This profile belongs to another store."
                    ], 403);
                }

                return response()->json([
                    'success' => false,
                    'message' => "Template profile ID {$id} does not exist inside the database table fields."
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $template
            ], 200);

        } catch (\Exception $e) {
            Log::error('BARCODE TEMPLATE SHOW CRASH: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Internal Server Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'template_name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'note' => 'nullable|string',
                'paper_brand' => 'nullable|string|max:255',
                'paper_model' => 'nullable|string|max:255',
                'layout_settings' => 'nullable|array',
            ]);

            $user = Auth::user();
            $template = $user->barcodeTemplates()->findOrFail($id);
            $template->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Template updated successfully!',
                'data' => $template
            ], 200);

        } catch (\Exception $e) {
            Log::error('BARCODE TEMPLATE UPDATE CRASH: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update template: ' . $e->getMessage()
            ], 500);
        }
    }


    public function destroy($id)
    {
        try {
            $user = auth()->user();

            $template = $user->barcodeTemplates()->findOrFail($id);
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template removed from database registry successfully.'
            ], 200);

        } catch (\Exception $e) {
            Log::error('BARCODE TEMPLATE DESTROY CRASH: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to drop database entry: ' . $e->getMessage()
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LabelHistory;

class LabelHistoryController extends Controller
{
    // STORE HISTORY
    public function store(Request $request)
{
    try {
        $request->validate([
            'type' => 'required|string',
            'template_id' => 'nullable',
            'template_name' => 'nullable|string',
            'products' => 'array'
        ]);

        $history = LabelHistory::create([
            'type' => $request->type,
            'template_id' => $request->template_id,
            'template_name' => $request->template_name,
            'product_count' => count($request->products ?? []),
            'products' => $request->products ?? [],
        ]);

        return response()->json([
            'success' => true,
            'data' => $history
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}

    // FETCH HISTORY
    public function index(Request $request)
    {
        $query = LabelHistory::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest()->get()
        ]);
    }
}
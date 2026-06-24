<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\LabelHistory;

class LabelHistoryController extends Controller
{
    public function store(Request $request)
    {
        $history = LabelHistory::create([
            'type' => $request->type,
            'template_name' => $request->template_name,
            'product_count' => count($request->products ?? []),
            'products' => $request->products
        ]);

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => LabelHistory::latest()->get()
        ]);
    }
}
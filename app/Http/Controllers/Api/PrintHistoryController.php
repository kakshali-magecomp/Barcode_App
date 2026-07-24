<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintHistory;
use App\Models\PrintHistoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrintHistoryController extends Controller
{
    /**
     * Save a new print history
     */
    public function store(Request $request)
    {
        \Log::info($request->all());
        $request->validate([
            'template_id' => 'nullable|integer',
            'products' => 'required|array|min:1',
            'products.*.variant_id' => 'required',
            'products.*.product_title' => 'required',
            'products.*.current_sku' => 'nullable',
            'products.*.barcode' => 'nullable',
            'products.*.online_url' => 'nullable',
            'products.*.qty' => 'required|integer|min:1',
        ]);

        $history = PrintHistory::create([
            'user_id' => Auth::id(),
            'template_id' => $request->template_id,
            'print_qty' => collect($request->products)->sum('qty'),
            'client_ip' => $request->ip(),
            'printed_at' => now(),
        ]);

        foreach ($request->products as $product) {

            PrintHistoryItem::create([

                'print_history_id' => $history->id,
                'product_id' => $product['product_id'] ?? null,
                'variant_id' => $product['variant_id'],
                'product_title' => $product['product_title'],
                'sku' => $product['current_sku'] ?? $product['sku'] ?? null,
                'barcode' => $product['barcode'] ?? null,
                'online_url' => $product['online_url'] ?? null,
                'qty' => $product['qty'] ?? 1,
            ]);
        }

        return response()->json([
            'success' => true,
            'history_id' => $history->id,
        ]);
    }

    /**
     * History List
     */
    public function index()
    {
        $histories = PrintHistory::with('template')
            ->where('user_id', Auth::id())
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $histories,
        ]);
    }

    /**
     * Single History Details
     */
    public function show($id)
    {
        $history = PrintHistory::with('items')
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Delete History
     */
    public function destroy($id)
    {
        $history = PrintHistory::where('user_id', Auth::id())
            ->findOrFail($id);

        $history->delete();

        return response()->json([
            'success' => true,
        ]);
    }
}
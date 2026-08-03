<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrintHistory;
use App\Models\PrintHistoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrintHistoryController extends Controller
{
    // save new print history
    public function store(Request $request)
    {
        $request->validate([
            'template_id' => 'nullable|integer',
            'products' => 'required|array|min:1',
            'products.*.variant_id' => 'required',
            'products.*.product_title' => 'required',
            'products.*.current_sku' => 'nullable',
            'products.*.barcode' => 'nullable',
            'products.*.online_url' => 'nullable',
            'products.*.price' => 'nullable',
            'products.*.vendor' => 'nullable',
            'products.*.variant_title' => 'nullable',
            'products.*.option_1' => 'nullable',
            'products.*.option_2' => 'nullable',
            'products.*.option_3' => 'nullable',
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
            \Log::info('PRINT PRODUCT DATA', $product);
            PrintHistoryItem::create([
                'print_history_id' => $history->id,
                'product_id' => $product['product_id'] ?? null,
                'variant_id' => $product['variant_id'],
                'product_title' => $product['product_title'],
                'sku' => $product['current_sku'] ?? $product['sku'] ?? null,
                'barcode' => $product['barcode'] ?? null,
                'barcode_format' => $product['barcode_format'] ?? 'CODE128',
                'online_url' => $product['online_url'] ?? null,
                'price' => $product['price'] ?? null,
                'vendor' => $product['vendor'] ?? null,
                'variant_title' => $product['variant_title'] ?? null,
                'option_1' => $product['option_1'] ?? null,
                'option_2' => $product['option_2'] ?? null,
                'option_3' => $product['option_3'] ?? null,
                'qty' => $product['qty'] ?? 1,
            ]);
        }

        return response()->json([
            'success' => true,
            'history_id' => $history->id,
        ]);
    }

    // history list
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

    //single history detail
    public function show($id)
    {
        $history = PrintHistory::with('items','template')
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    //delete history
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
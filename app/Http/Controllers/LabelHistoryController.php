<?php

namespace App\Http\Controllers;

use App\Models\LabelHistory;
use Illuminate\Support\Facades\Auth;

class LabelHistoryController extends Controller
{
    public function index()
    {
        $histories = LabelHistory::with('template')
            ->where('user_id', Auth::id())
            ->orderByDesc('printed_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $histories,
        ]);
    }

    public function show($id)
    {
        $history = LabelHistory::with('template')
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    public function destroy($id)
    {
        $history = LabelHistory::where('user_id', Auth::id())
            ->findOrFail($id);

        $history->delete();

        return response()->json([
            'success' => true,
            'message' => 'History deleted successfully.',
        ]);
    }
}
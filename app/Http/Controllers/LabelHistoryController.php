<?php

namespace App\Http\Controllers;

use App\Models\LabelHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LabelHistoryController extends Controller
{
    
    public function index()
    {
        $user = Auth::user();

        $histories = LabelHistory::with('template')
            ->where('user_id', $user->id)
            ->latest('printed_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $histories
        ]);
    }

    
    public function show($id)
    {
        $user = Auth::user();

        $history = LabelHistory::with('template')
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    
    public function destroy($id)
    {
        $user = Auth::user();

        $history = LabelHistory::where('user_id', $user->id)
            ->findOrFail($id);

        $history->delete();

        return response()->json([
            'success' => true,
            'message' => 'History deleted successfully.'
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\BulkOperation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BulkOperationController extends Controller
{
    public function show($id)
    {
        $shop = Auth::user();
        if (!$shop) {
            return response()->json(["status" => 0, "error" => "Unauthenticated"], 401);
        }

        $operation = BulkOperation::where('id', $id)
            ->where('user_id', $shop->id)
            ->first();

        if (!$operation) {
            return response()->json(["status" => 0, "error" => "Not found"], 404);
        }

        return response()->json([
            "status" => 1,
            "operation" => [
                "id" => $operation->id,
                "type" => $operation->type,
                "status" => $operation->status, // pending | processing | completed
                "total" => $operation->total,
                "processed" => $operation->processed,
                "failed" => $operation->failed,
                "updated_products" => $operation->updated_products ?? [],
            ],
        ]);
    }
}
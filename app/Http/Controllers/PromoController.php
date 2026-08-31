<?php
 
namespace App\Http\Controllers;
 
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
 
class PromoController extends Controller
{
    public function closePromo(Request $request)
    {
        $userId = Auth::id();
        $data = User::find($userId);
        if ($data) {
            $data->close_promo = 1;
            $data->save();
        } else {
        }
        return response()->json(['message' => 'close_promo confirmed'], 200);
    }
 
    public function getPromptdata(Request $request)
    {
        $userId = Auth::id();
        $data = User::find($userId);
        $close_promo = $data->close_promo;
        return collect([
            'promo' => $close_promo
        ]);
    }
}

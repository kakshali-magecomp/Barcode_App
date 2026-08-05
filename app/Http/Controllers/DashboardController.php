<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\PrintHistory;
use App\Models\PrintHistoryItem;
use App\Helpers\ShopifyQueryHelper;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $templatesCount = $user->barcodeTemplates()->count();

        $totalPrints = PrintHistoryItem::whereHas('history', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->sum('qty');

        $todayPrints = PrintHistoryItem::whereHas('history', function ($q) use ($user) {

            $q->where('user_id', $user->id)
                ->whereDate('printed_at', Carbon::today());

        })->sum('qty');

        $monthPrints = PrintHistoryItem::whereHas('history', function ($q) use ($user) {

            $q->where('user_id', $user->id)
                ->whereMonth('printed_at', Carbon::now()->month)
                ->whereYear('printed_at', Carbon::now()->year);

        })->sum('qty');

        $recentPrints = PrintHistory::with('template')
            ->where('user_id', $user->id)
            ->latest('printed_at')
            ->take(5)
            ->get();

        $topTemplate = PrintHistory::selectRaw('template_id, COUNT(*) as total')
            ->where('user_id', $user->id)
            ->groupBy('template_id')
            ->orderByDesc('total')
            ->with('template')
            ->first();



        $productsCount = 0;

        try {

            $query = ShopifyQueryHelper::showproduct();

            $response = $user->api()->graph($query);

            $response = json_decode(json_encode($response), true);

            $edges =
                $response['body']['container']['data']['products']['edges']
                ??
                $response['body']['data']['products']['edges']
                ??
                [];

            $productsCount = count($edges);

        } catch (\Exception $e) {
            $productsCount = 0;
        }

        return response()->json([

            "success" => true,

            "statistics" => [

                "templates_count" => $templatesCount,

                "products_count" => $productsCount,

                "total_prints" => $totalPrints,

                "today_prints" => $todayPrints,

                "month_prints" => $monthPrints,

                "top_template" => $topTemplate,

                "recent_prints" => $recentPrints

            ]

        ]);
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
{
    return response()->json([
        'stats' => [
            'templates' => 12,
            'generated_barcodes' => 156,
            'printed_labels' => 89,
            'current_plan' => 'Pro'
        ]
    ]);
}
}

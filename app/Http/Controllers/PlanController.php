<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlanController extends Controller
{

    public function index(Request $request): JsonResponse
    {
        try {

            Log::info('Plan request received.', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'shop' => $request->input('shop'),
                'host' => $request->input('host'),
                'user_id' => Auth::id(),
            ]);



            $allPlans = DB::table('plans')
                ->get();

            Log::info('All records found in plans table.', [
                'count' => $allPlans->count(),
                'plans' => $allPlans->map(function ($plan) {
                    return (array) $plan;
                })->toArray(),
            ]);



            $recurringPlans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->get();

            Log::info('RECURRING plans found.', [
                'count' => $recurringPlans->count(),
                'plans' => $recurringPlans->map(function ($plan) {
                    return (array) $plan;
                })->toArray(),
            ]);

            $monthlyPlans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->where('interval', 'EVERY_30_DAYS')
                ->get();

            Log::info('Monthly plans found.', [
                'count' => $monthlyPlans->count(),
                'plans' => $monthlyPlans->map(function ($plan) {
                    return (array) $plan;
                })->toArray(),
            ]);



            $yearlyPlans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->where('interval', 'ANNUAL')
                ->get();

            Log::info('Yearly plans found.', [
                'count' => $yearlyPlans->count(),
                'plans' => $yearlyPlans->map(function ($plan) {
                    return (array) $plan;
                })->toArray(),
            ]);



            $plans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->whereIn('interval', [
                    'EVERY_30_DAYS',
                    'ANNUAL',
                ])
                ->get([
                    'id',
                    'name',
                    'price',
                    'interval',
                    'test',
                    'on_install',
                ]);

            Log::info('Final subscription plans query result.', [
                'count' => $plans->count(),
                'plans' => $plans->map(function ($plan) {
                    return (array) $plan;
                })->toArray(),
            ]);



            $intervalOrder = [
                'EVERY_30_DAYS' => 1,
                'ANNUAL' => 2,
            ];

            $plans = $plans
                ->sortBy(function ($plan) use ($intervalOrder) {
                    return $intervalOrder[$plan->interval] ?? 99;
                })
                ->values();



            $formattedPlans = $plans->map(function ($plan) {

                $billingPeriod = null;

                if ($plan->interval === 'EVERY_30_DAYS') {
                    $billingPeriod = 'monthly';
                }

                if ($plan->interval === 'ANNUAL') {
                    $billingPeriod = 'yearly';
                }

                return [
                    'id' => (int) $plan->id,

                    'name' => $plan->name,

                    'price' => number_format(
                        (float) $plan->price,
                        2,
                        '.',
                        ''
                    ),

                    'interval' => $plan->interval,

                    'billing_period' => $billingPeriod,

                    'test' => (bool) $plan->test,

                    'on_install' => (bool) $plan->on_install,
                ];
            })->values();

            Log::info('Final formatted plans sent to React.', [
                'count' => $formattedPlans->count(),
                'plans' => $formattedPlans->toArray(),
            ]);


            return response()->json([
                'success' => true,
                'plans' => $formattedPlans,
            ]);

        } catch (\Throwable $e) {

            Log::error('PLAN LIST ERROR.', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to load subscription plans.',
            ], 500);
        }
    }



    public function subscribe(
        Request $request,
        int $plan
    ): JsonResponse {
        try {


            Log::info('Subscription request received.', [
                'plan_id' => $plan,
                'shop' => $request->input('shop'),
                'host' => $request->input('host'),
                'user_id' => Auth::id(),
            ]);



            $selectedPlan = DB::table('plans')
                ->where('id', $plan)
                ->where('type', 'RECURRING')
                ->whereIn('interval', [
                    'EVERY_30_DAYS',
                    'ANNUAL',
                ])
                ->first();

            if (!$selectedPlan) {

                Log::warning(
                    'Selected plan was not found.',
                    [
                        'requested_plan_id' => $plan,
                    ]
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Selected plan was not found.',
                ], 404);
            }

            Log::info('Selected plan found.', [
                'plan' => (array) $selectedPlan,
            ]);



            $shop = Auth::user();

            if (!$shop) {

                Log::warning(
                    'Subscription request has no authenticated shop.'
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Shop authentication is required.',
                ], 401);
            }

            Log::info('Authenticated Shopify shop.', [
                'user_id' => $shop->id,
                'shop_name' => $shop->name,
                'plan_id' => $shop->plan_id ?? null,
            ]);



            $shopDomain = $shop->name;

            if (!$shopDomain) {

                Log::error(
                    'Shop domain is missing from authenticated user.',
                    [
                        'user_id' => $shop->id,
                    ]
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain could not be determined.',
                ], 422);
            }


            $host = $request->input('host');

            if (!$host) {

                Log::warning(
                    'Shopify host parameter is missing.'
                );

                return response()->json([
                    'success' => false,
                    'message' => 'Shopify host parameter is missing.',
                ], 422);
            }



            $billingUrl = route('billing', [
                'plan' => $selectedPlan->id,
                'shop' => $shopDomain,
                'host' => $host,
            ]);

            Log::info('Billing URL generated.', [
                'billing_url' => $billingUrl,
                'plan_id' => $selectedPlan->id,
                'shop' => $shopDomain,
            ]);


            return response()->json([
                'success' => true,

                'plan' => [
                    'id' => (int) $selectedPlan->id,

                    'name' => $selectedPlan->name,

                    'price' => number_format(
                        (float) $selectedPlan->price,
                        2,
                        '.',
                        ''
                    ),

                    'interval' => $selectedPlan->interval,
                ],

                'billing_url' => $billingUrl,
            ]);

        } catch (\Throwable $e) {

            Log::error(
                'PLAN SUBSCRIPTION ERROR.',
                [
                    'plan_id' => $plan,
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            return response()->json([
                'success' => false,
                'message' => 'Unable to start subscription.',
            ], 500);
        }
    }
}
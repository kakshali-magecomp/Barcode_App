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

            $allPlans = DB::table('plans')
                ->get();

            $recurringPlans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->get();

            $monthlyPlans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->where('interval', 'EVERY_30_DAYS')
                ->get();

            $yearlyPlans = DB::table('plans')
                ->where('type', 'RECURRING')
                ->where('interval', 'ANNUAL')
                ->get();


            // EVERY_30_DAYS or ANNUAL — these two string values are Shopify's own enum values for the Billing API
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

            $shop = Auth::user();
            $activePlanId = $shop && $shop->plan_id ? (int) $shop->plan_id : null;

            return response()->json([
                'success' => true,
                'plans' => $formattedPlans,
                'active_plan_id' => $activePlanId,
            ]);

        } catch (\Throwable $e) {

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

            $selectedPlan = DB::table('plans')
                ->where('id', $plan)
                ->where('type', 'RECURRING')
                ->whereIn('interval', [
                    'EVERY_30_DAYS',
                    'ANNUAL',
                ])
                ->first();

            if (!$selectedPlan) {

                return response()->json([
                    'success' => false,
                    'message' => 'Selected plan was not found.',
                ], 404);
            }
            // $shop->name — in the kyon147 package's schema, the shop's name column stores the .myshopify.com domain
            // This is required because Shopify's Billing API needs to know exactly which store to attach the charge to
            $shop = Auth::user();

            if (!$shop) {

                return response()->json([
                    'success' => false,
                    'message' => 'Shop authentication is required.',
                ], 401);
            }

            $shopDomain = $shop->name;

            if (!$shopDomain) {

                return response()->json([
                    'success' => false,
                    'message' => 'Shop domain could not be determined.',
                ], 422);
            }

            // host — the base64-encoded Shopify Admin host parameter that your React code reads 
            // from window.location.search and appends to the request URL (?host=...)
            $host = $request->input('host');

            if (!$host) {

                return response()->json([
                    'success' => false,
                    'message' => 'Shopify host parameter is missing.',
                ], 422);
            }

            // The core kyon147 integration point.
            // frontend does via window.top.location.href — triggers the package's internal controller to actually call Shopify's Billing API and create the charge, 
            // then redirect the merchant to Shopify's hosted confirmation page.
            // Your controller here only builds the URL; it does not itself talk to Shopify.
            $billingUrl = route('billing', [
                'plan' => $selectedPlan->id,
                'shop' => $shopDomain,
                'host' => $host,
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

            return response()->json([
                'success' => false,
                'message' => 'Unable to start subscription.',
            ], 500);
        }
    }
}
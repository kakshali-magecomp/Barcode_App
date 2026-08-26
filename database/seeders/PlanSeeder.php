<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        Log::info('================ PLAN SEEDER START ================');

        $now = now();

        /*
        |--------------------------------------------------------------------------
        | Monthly
        |--------------------------------------------------------------------------
        */

        DB::table('plans')->updateOrInsert(
            [
                'type' => 'RECURRING',
                'interval' => 'EVERY_30_DAYS',
            ],
            [
                'name' => 'Basic',
                'price' => 3.99,
                'capped_amount' => null,
                'terms' => null,
                'trial_days' => 0,
                'test' => env(
                    'SHOPIFY_BILLING_TEST',
                    true
                ),
                'on_install' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        Log::info(
            'Monthly plan inserted/updated.',
            [
                'type' => 'RECURRING',
                'name' => 'Basic',
                'price' => 3.99,
                'interval' => 'EVERY_30_DAYS',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Yearly
        |--------------------------------------------------------------------------
        */

        DB::table('plans')->updateOrInsert(
            [
                'type' => 'RECURRING',
                'interval' => 'ANNUAL',
            ],
            [
                'name' => 'Basic',
                'price' => 39.99,
                'capped_amount' => null,
                'terms' => null,
                'trial_days' => 0,
                'test' => env(
                    'SHOPIFY_BILLING_TEST',
                    true
                ),
                'on_install' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        Log::info(
            'Yearly plan inserted/updated.',
            [
                'type' => 'RECURRING',
                'name' => 'Basic',
                'price' => 39.99,
                'interval' => 'ANNUAL',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Verify records after seeding
        |--------------------------------------------------------------------------
        */

        $plans = DB::table('plans')
            ->where('type', 'RECURRING')
            ->whereIn('interval', [
                'EVERY_30_DAYS',
                'ANNUAL',
            ])
            ->get();

        Log::info(
            'Plans found after seeder.',
            [
                'count' => $plans->count(),
                'plans' => $plans
                    ->map(fn ($plan) => (array) $plan)
                    ->toArray(),
            ]
        );

        Log::info('================ PLAN SEEDER COMPLETE ================');
    }
}
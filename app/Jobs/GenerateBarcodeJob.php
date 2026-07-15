<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateBarcodeJob implements ShouldQueue
{
    use Queueable;

    protected $product;

    public function __construct($product)
    {
        $this->product = $product;
    }

    public function handle(): void
    {
        Log::info("Running Generate Barcode Job");

        Log::info($this->product);

        // Generate barcode

        // Update Shopify

        // Save to database
    }
}
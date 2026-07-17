<?php

namespace App\Jobs;

use App\Helpers\ShopifyQueryHelper;
use App\Models\BarcodeSetting;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateBarcodeJob implements ShouldQueue
{
    use Queueable;

    protected $shop;
    protected $product;

    public function __construct($shop, $product)
    {
        $this->shop = $shop;
        $this->product = $product;
    }

    public function handle(): void
    {
        try {

        
            Log::info("generateBarcode job is called");
            $user = User::where('name', $this->shop)->first();

            if (!$user) {
                Log::error("Shop not found : {$this->shop}");
                return;
            }

            $setting = BarcodeSetting::where(
                'user_id',
                $user->id
            )->first();

            if (
                !$setting ||
                !$setting->auto_generate_on_create
            ) {
                Log::info("Auto barcode generation disabled.");
                return;
            }

            $product = $this->product;

            Log::info("WEBHOOK PRODUCT DATA");
            Log::info($product);
            if (
                !isset($product['admin_graphql_api_id']) ||
                !isset($product['variants'])
            ) {
                Log::error("Invalid webhook payload.");
                return;
            }

            $variants = [];

            foreach ($product['variants'] as $variant) {

                $barcode = $this->generateBarcode(
                    $setting->barcode_pattern,
                    $product,
                    $variant
                );

                $variants[] = [
                    "id" => $variant["admin_graphql_api_id"],
                    "barcode" => $barcode,
                ];
            }

            $variables = [
                "productId" => $product["admin_graphql_api_id"],
                "variants" => $variants,
            ];

            $response = $user
                ->api()
                ->graph(
                    ShopifyQueryHelper::updateBarcode(),
                    $variables
                );

            Log::info("Webhook Barcode Updated", [
                "response" => $response,
            ]);

        } catch (\Exception $e) {

            Log::error($e->getMessage());

        }
    }

    private function generateBarcode($pattern, $product, $variant)
    {
        if (!$pattern) {
            return "";
        }

        return preg_replace_callback(
            '/\[(PRODUCT(?:\.\d+)?|SKU|VENDOR|HANDLE|A\.\d+|N\.\d+)\]/',
            function ($match) use ($product, $variant) {

                $token = $match[1];

                // PRODUCT
                if (str_starts_with($token, "PRODUCT")) {

                    $text = strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $product["title"] ?? ""
                        )
                    );

                    if (str_contains($token, ".")) {

                        $len = (int) explode(".", $token)[1];

                        return substr($text, 0, $len);
                    }

                    return $text;
                }

                // SKU
                if ($token == "SKU") {

                    return strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $variant["sku"] ?? ""
                        )
                    );
                }

                // Vendor
                if ($token == "VENDOR") {

                    return strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $product["vendor"] ?? ""
                        )
                    );
                }

                // Handle
                if ($token == "HANDLE") {

                    return strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $product["handle"] ?? ""
                        )
                    );
                }

                // Random Alpha
                if (str_starts_with($token, "A.")) {

                    $len = (int) explode(".", $token)[1];

                    $letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

                    $result = "";

                    for ($i = 0; $i < $len; $i++) {

                        $result .= $letters[random_int(0, 25)];
                    }

                    return $result;
                }

                // Random Numeric
                if (str_starts_with($token, "N.")) {

                    $len = (int) explode(".", $token)[1];

                    $numbers = "0123456789";

                    $result = "";

                    for ($i = 0; $i < $len; $i++) {

                        $result .= $numbers[random_int(0, 9)];
                    }

                    if ($len > 1) {

                        // prevent starting with 0
                        if ($result[0] == "0") {
                            $result[0] = random_int(1, 9);
                        }

                        // prevent ending with 0
                        if ($result[$len - 1] == "0") {
                            $result[$len - 1] = random_int(1, 9);
                        }
                    }

                    return $result;
                }

                return "";
            },
            $pattern
        );
    }
}
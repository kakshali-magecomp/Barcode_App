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
                    $setting,
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

    private function generateBarcode($setting, $product, $variant)
{
    $pattern = $setting->barcode_pattern ?? "";
    $format  = strtoupper($setting->barcode_format ?? "CODE128");

    /*
    |--------------------------------------------------------------------------
    | GTIN Formats
    |--------------------------------------------------------------------------
    */

    switch ($format) {

        case "EAN8":
            return $this->randomNumeric(8);

        case "EAN13":
            return $this->randomNumeric(13);

        case "UPC":
        case "UPCA":
            return $this->randomNumeric(12);

        case "ITF14":
            return $this->randomNumeric(14);

        case "CODE39":
            return strtoupper(substr(
                preg_replace('/[^A-Za-z0-9]/', '', $variant["sku"] ?? ""),
                0,
                20
            ));

        case "CODE128":
        default:
            break;
    }

    if (!$pattern) {
        return strtoupper(
            preg_replace(
                '/[^A-Za-z0-9]/',
                '',
                $variant["sku"] ?? ""
            )
        );
    }

    return preg_replace_callback(
        '/\[(PRODUCT(?:\.\d+)?|SKU|VENDOR|HANDLE|A\.\d+|N\.\d+)\]/',
        function ($match) use ($product, $variant) {

            $token = $match[1];

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

            if ($token == "SKU") {

                return strtoupper(
                    preg_replace(
                        '/[^A-Za-z0-9]/',
                        '',
                        $variant["sku"] ?? ""
                    )
                );
            }

            if ($token == "VENDOR") {

                return strtoupper(
                    preg_replace(
                        '/[^A-Za-z0-9]/',
                        '',
                        $product["vendor"] ?? ""
                    )
                );
            }

            if ($token == "HANDLE") {

                return strtoupper(
                    preg_replace(
                        '/[^A-Za-z0-9]/',
                        '',
                        $product["handle"] ?? ""
                    )
                );
            }

            if (str_starts_with($token, "A.")) {

                $len = (int) explode(".", $token)[1];

                $letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

                $result = "";

                for ($i = 0; $i < $len; $i++) {

                    $result .= $letters[random_int(0, 25)];
                }

                return $result;
            }

            if (str_starts_with($token, "N.")) {

                $len = (int) explode(".", $token)[1];

                return $this->randomNumeric($len);
            }

            return "";
        },
        $pattern
    );
}
private function randomNumeric($length)
{
    $numbers = "0123456789";

    $value = "";

    for ($i = 0; $i < $length; $i++) {

        $value .= $numbers[random_int(0, 9)];
    }

    if ($length > 1) {

        if ($value[0] == "0") {
            $value[0] = random_int(1, 9);
        }

        if ($value[$length - 1] == "0") {
            $value[$length - 1] = random_int(1, 9);
        }
    }

    return $value;
}
}
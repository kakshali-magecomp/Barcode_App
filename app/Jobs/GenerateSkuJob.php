<?php

namespace App\Jobs;

use App\Helpers\ShopifyQueryHelper;
use App\Models\SkuSetting;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class GenerateSkuJob implements ShouldQueue
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

            Log::info('GenerateSkuJob started', [
                'shop' => $this->shop,
            ]);

            $user = User::where(
                'name',
                $this->shop
            )->first();

            if (!$user) {

                Log::error(
                    "Shop not found: {$this->shop}"
                );

                return;
            }

            $setting = SkuSetting::where(
                'user_id',
                $user->id
            )->first();

            if (
                !$setting ||
                !$setting->auto_generate_on_create
            ) {

                Log::info(
                    'Auto SKU generation disabled.',
                    [
                        'user_id' => $user->id,
                    ]
                );

                return;
            }

            $product = $this->product;

            if (
                empty($product['admin_graphql_api_id']) ||
                !isset($product['variants']) ||
                !is_array($product['variants'])
            ) {

                Log::error(
                    'Invalid Shopify product webhook payload.',
                    [
                        'product' => $product,
                    ]
                );

                return;
            }

            $variants = [];

            foreach ($product['variants'] as $variant) {

                $variantId =
                    $variant['admin_graphql_api_id']
                    ?? null;

                if (!$variantId) {

                    Log::warning(
                        'Variant does not have admin_graphql_api_id.',
                        [
                            'variant' => $variant,
                        ]
                    );

                    continue;
                }

                if (!empty($variant['sku'])) {

                    Log::info(
                        'Variant already has SKU. Skipping.',
                        [
                            'variant_id' => $variantId,
                            'sku' => $variant['sku'],
                        ]
                    );

                    continue;
                }

                $sku = $this->generateSku(
                    $setting,
                    $product,
                    $variant
                );

                if (empty($sku)) {

                    Log::warning(
                        'Generated SKU is empty. Skipping variant.',
                        [
                            'variant_id' => $variantId,
                        ]
                    );

                    continue;
                }

                Log::info(
                    'Generated automatic SKU.',
                    [
                        'variant_id' => $variantId,
                        'sku' => $sku,
                    ]
                );

                $variants[] = [
                    'id' => $variantId,
                    'inventoryItem' => [
                        'sku' => $sku,
                    ],
                ];
            }

            if (empty($variants)) {

                Log::info(
                    'No variants require SKU generation.'
                );

                return;
            }

            $variables = [
                'productId' =>
                    $product['admin_graphql_api_id'],

                'variants' => $variants,
            ];

            $response = $user->api()->graph(
                ShopifyQueryHelper::updateSku(),
                $variables
            );

            Log::info(
                'Auto SKU updated successfully.',
                [
                    'variant_count' => count($variants),
                    'response' => $response,
                ]
            );

        } catch (\Throwable $e) {

            Log::error(
                'GenerateSkuJob failed.',
                [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
            );
        }
    }

    private function generateSku(
        $setting,
        $product,
        $variant
    ) {

        $delimiter =
            $setting->sku_delimiter ?: '-';

        $parts = [];

        if (!empty($setting->sku_prefix)) {

            $prefix = $this->clean(
                $setting->sku_prefix,
                $setting
            );

            if ($prefix !== '') {
                $parts[] = $prefix;
            }
        }

        $title = $this->parseSegment(
            $product['title'] ?? '',
            $setting->segment_product_title
        );

        if ($title !== null && $title !== '') {

            $title = $this->clean(
                $title,
                $setting
            );

            if ($title !== '') {
                $parts[] = $title;
            }
        }

        $vendor = $this->parseSegment(
            $product['vendor'] ?? '',
            $setting->segment_product_vendor
        );

        if ($vendor !== null && $vendor !== '') {

            $vendor = $this->clean(
                $vendor,
                $setting
            );

            if ($vendor !== '') {
                $parts[] = $vendor;
            }
        }

        $productTypeValue =
            $product['product_type']
            ?? $product['productType']
            ?? '';

        $productType = $this->parseSegment(
            $productTypeValue,
            $setting->segment_product_type
        );

        if (
            $productType !== null &&
            $productType !== ''
        ) {

            $productType = $this->clean(
                $productType,
                $setting
            );

            if ($productType !== '') {
                $parts[] = $productType;
            }
        }


        if (!empty($setting->segment_metafield)) {

            $metafieldValue =
                $this->getMetafieldValue(
                    $product,
                    $setting->segment_metafield
                );

            if ($metafieldValue !== '') {

                $metafield = $this->parseSegment(
                    $metafieldValue,
                    $setting->segment_metafield_rule
                );

                if (
                    $metafield !== null &&
                    $metafield !== ''
                ) {

                    $metafield = $this->clean(
                        $metafield,
                        $setting
                    );

                    if ($metafield !== '') {
                        $parts[] = $metafield;
                    }
                }
            }
        }

        if (!$setting->hide_options_1_2_3) {

            $option1Value =
                $this->getVariantOption(
                    $variant,
                    1
                );

            $option1 = $this->parseSegment(
                $option1Value,
                $setting->segment_option1
            );

            if (
                $option1 !== null &&
                $option1 !== ''
            ) {

                $option1 = $this->clean(
                    $option1,
                    $setting
                );

                if ($option1 !== '') {
                    $parts[] = $option1;
                }
            }

            $option2Value =
                $this->getVariantOption(
                    $variant,
                    2
                );

            $option2 = $this->parseSegment(
                $option2Value,
                $setting->segment_option2
            );

            if (
                $option2 !== null &&
                $option2 !== ''
            ) {

                $option2 = $this->clean(
                    $option2,
                    $setting
                );

                if ($option2 !== '') {
                    $parts[] = $option2;
                }
            }

            $option3Value =
                $this->getVariantOption(
                    $variant,
                    3
                );

            $option3 = $this->parseSegment(
                $option3Value,
                $setting->segment_option3
            );

            if (
                $option3 !== null &&
                $option3 !== ''
            ) {

                $option3 = $this->clean(
                    $option3,
                    $setting
                );

                if ($option3 !== '') {
                    $parts[] = $option3;
                }
            }
        }

        $number =
            $setting->sku_auto_number_start ?: 1;

        $parts[] = $number;

        if (!empty($setting->sku_suffix)) {

            $suffix = $this->clean(
                $setting->sku_suffix,
                $setting
            );

            if ($suffix !== '') {
                $parts[] = $suffix;
            }
        }

        $parts = array_values(
            array_filter(
                $parts,
                function ($part) {
                    return $part !== null &&
                        $part !== '';
                }
            )
        );

        $sku = implode(
            $delimiter,
            $parts
        );
        $sku = $this->normalizeDelimiters($sku, $delimiter);


        if ($setting->force_uppercase_fields) {
            $sku = strtoupper($sku);
        }

        return $sku;
    }
    private function normalizeDelimiters(string $sku, string $delimiter): string
    {
        if ($delimiter === '') {
            return $sku;
        }
        $escaped = preg_quote($delimiter, '/');
        $sku = preg_replace('/(?:' . $escaped . '){2,}/', $delimiter, $sku);
        return trim($sku, $delimiter);
    }
    private function parseSegment(
        $value,
        $mode
    ) {

        if (
            !$mode ||
            $mode === 'none' ||
            $mode === 'disabled'
        ) {
            return null;
        }

        $value = trim(
            (string) $value
        );

        if ($value === '') {
            return null;
        }

        switch ($mode) {

            case 'full':

                return $value;

            case 'char_1':

                return substr(
                    $value,
                    0,
                    1
                );

            case 'char_2':

                return substr(
                    $value,
                    0,
                    2
                );

            case 'char_3':

                return substr(
                    $value,
                    0,
                    3
                );

            case 'char_4':

                return substr(
                    $value,
                    0,
                    4
                );

            default:

                return null;
        }
    }

    private function getVariantOption($variant, $number)
    {
        $key = 'option' . $number;
        $rawValue = '';

        if (isset($variant[$key]) && $variant[$key] !== null && $variant[$key] !== '') {
            $rawValue = (string) $variant[$key];
        } else {
            $selectedOptions = $variant['selectedOptions'] ?? [];
            $index = $number - 1;
            if (is_array($selectedOptions) && isset($selectedOptions[$index]['value'])) {
                $rawValue = (string) $selectedOptions[$index]['value'];
            }
        }

        $cleaned = $this->stripDefaultPlaceholder($rawValue);

        if ($rawValue !== $cleaned) {
            Log::info("GenerateSkuJob: stripped placeholder option{$number}", [
                'raw' => $rawValue,
                'cleaned' => $cleaned,
            ]);
        }

        return $cleaned;
    }

    private function stripDefaultPlaceholder(string $value): string
    {
        $normalized = trim(preg_replace('/\s+/u', ' ', $value));

        if (preg_match('/^default([\s_-]*title)?$/i', $normalized)) {
            return '';
        }

        return $value;
    }


    private function getMetafieldValue(
        $product,
        $key
    ) {

        if (empty($key)) {
            return '';
        }

        $metafields =
            $product['metafields'] ?? [];

        if (!is_array($metafields)) {
            return '';
        }


        if (
            isset($metafields[$key])
        ) {

            $value =
                $metafields[$key];

            if (is_array($value)) {
                return (string) (
                    $value['value'] ?? ''
                );
            }

            return (string) $value;
        }


        foreach (
            $metafields as $metafield
        ) {

            if (!is_array($metafield)) {
                continue;
            }

            $namespace =
                $metafield['namespace'] ?? '';

            $metafieldKey =
                $metafield['key'] ?? '';

            $fullKey =
                $namespace .
                '.' .
                $metafieldKey;

            if ($fullKey === $key) {

                return (string) (
                    $metafield['value'] ?? ''
                );
            }
        }

        return '';
    }

    private function clean(
        $value,
        $setting
    ) {

        $value = trim(
            (string) $value
        );

        if ($value === '') {
            return '';
        }

        $delimiter =
            $setting->sku_delimiter ?: '-';

        //replace spacial character
        $value = preg_replace(
            '/[^A-Za-z0-9]+/',
            $delimiter,
            $value
        );


        //Remove delimiter from beginning/end
        return trim(
            $value,
            $delimiter
        );
    }
}
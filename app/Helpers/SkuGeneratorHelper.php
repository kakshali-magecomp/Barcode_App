<?php

namespace App\Helpers;

class SkuGeneratorHelper
{
    public static function generate(
        $variant,
        $rules,
        $counter
    ) {

        $delimiter = $rules->sku_delimiter ?: "-";
        $segments = [];

        //prefix
        if (!empty($rules->sku_prefix)) {
            $segments[] = $rules->sku_prefix;
        }

        //product tile
        self::appendSegment(
            $segments,
            $variant['product_title'] ?? '',
            $rules->segment_product_title
        );

        //vendor

        self::appendSegment(
            $segments,
            $variant['vendor'] ?? '',
            $rules->segment_product_vendor
        );

        //product type
        self::appendSegment(
            $segments,
            $variant['product_type'] ?? '',
            $rules->segment_product_type
        );

        // Metafield
        if (
            !empty($rules->segment_metafield) &&
            !empty($rules->segment_metafield_rule)
        ) {

            $metaValue = '';

            if (
                !empty($variant['metafields']) &&
                is_array($variant['metafields'])
            ) {

                $metaValue =
                    $variant['metafields'][$rules->segment_metafield]
                    ?? '';

            }

            self::appendSegment(
                $segments,
                $metaValue,
                $rules->segment_metafield_rule
            );
        }

        //variant option
        if (!$rules->hide_options_1_2_3) {

            self::appendSegment(
                $segments,
                $variant['option_1'] ?? '',
                $rules->segment_option1
            );

            self::appendSegment(
                $segments,
                $variant['option_2'] ?? '',
                $rules->segment_option2
            );

            self::appendSegment(
                $segments,
                $variant['option_3'] ?? '',
                $rules->segment_option3
            );
        }

        //auto number
        $segments[] = $counter;

        //suffix
        if (!empty($rules->sku_suffix)) {
            $segments[] = $rules->sku_suffix;
        }

        //final SKU
        $sku = implode($delimiter, $segments);
        $sku = str_replace(" ", "", $sku);
        if ($rules->force_uppercase_fields) {
            $sku = strtoupper($sku);
        }
        return $sku;
    }

    //append segment according setting
    private static function appendSegment(
        &$segments,
        $value,
        $mode
    ) {
        if (!$mode || $mode == "none") {
            return;
        }
        switch ($mode) {

            case "full":
                $segments[] = $value;
                break;

            case "char_1":
                $segments[] = substr($value, 0, 1);
                break;

            case "char_2":
                $segments[] = substr($value, 0, 2);
                break;

            case "char_3":
                $segments[] = substr($value, 0, 3);
                break;

            case "char_4":
                $segments[] = substr($value, 0, 4);
                break;
        }
    }
}
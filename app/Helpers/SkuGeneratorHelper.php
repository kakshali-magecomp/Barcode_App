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
            self::addCleanedSegment($segments, $rules->sku_prefix, $delimiter);
        }

        //product tile
        self::appendSegment(
            $segments,
            $variant['product_title'] ?? '',
            $rules->segment_product_title,
            $delimiter
        );

        //vendor
        self::appendSegment(
            $segments,
            $variant['vendor'] ?? '',
            $rules->segment_product_vendor,
            $delimiter
        );

        //product type
        self::appendSegment(
            $segments,
            $variant['product_type'] ?? '',
            $rules->segment_product_type,
            $delimiter
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
                $rules->segment_metafield_rule,
                $delimiter
            );
        }

        //variant option
        if (!$rules->hide_options_1_2_3) {
            self::appendSegment(
                $segments,
                $variant['option_1'] ?? '',
                $rules->segment_option1,
                $delimiter
            );
            self::appendSegment(
                $segments,
                $variant['option_2'] ?? '',
                $rules->segment_option2,
                $delimiter
            );
            self::appendSegment(
                $segments,
                $variant['option_3'] ?? '',
                $rules->segment_option3,
                $delimiter
            );
        }

        //auto number
        self::addCleanedSegment($segments, $counter, $delimiter);

        //suffix
        if (!empty($rules->sku_suffix)) {
            self::addCleanedSegment($segments, $rules->sku_suffix, $delimiter);
        }

        //final SKU
        $sku = implode($delimiter, $segments);
        $sku = self::normalizeDelimiters($sku, $delimiter);

        if ($rules->force_uppercase_fields) {
            $sku = strtoupper($sku);
        }
        return $sku;
    }

    private static function normalizeDelimiters($sku, $delimiter)
    {
        if ($delimiter === '')
            return $sku;
        $escaped = preg_quote($delimiter, '/');
        $sku = preg_replace('/(?:' . $escaped . '){2,}/', $delimiter, $sku);
        return trim($sku, $delimiter);
    }

    private static function addCleanedSegment(&$segments, $value, $delimiter)
    {
        $value = trim((string) $value);
        if ($value === '')
            return;
        // Clean special characters to delimiter just like GenerateSkuJob
        $value = preg_replace('/[^A-Za-z0-9]+/', $delimiter, $value);
        $value = trim($value, $delimiter);
        if ($value !== '') {
            $segments[] = $value;
        }
    }

    //append segment according setting
    private static function appendSegment(
        &$segments,
        $value,
        $mode,
        $delimiter
    ) {
        if (!$mode || $mode == "none" || $mode == "disabled") {
            return;
        }

        $value = trim((string) $value);

        if ($value === '' || preg_match('/^default([\s_-]*title)?$/i', $value)) {
            return;
        }

        $val = '';
        switch ($mode) {
            case "full":
                $val = $value;
                break;
            case "char_1":
                $val = mb_substr($value, 0, 1);
                break;
            case "char_2":
                $val = mb_substr($value, 0, 2);
                break;
            case "char_3":
                $val = mb_substr($value, 0, 3);
                break;
            case "char_4":
                $val = mb_substr($value, 0, 4);
                break;
        }
        self::addCleanedSegment($segments, $val, $delimiter);
    }
}
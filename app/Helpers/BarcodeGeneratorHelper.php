<?php

namespace App\Helpers;

class BarcodeGeneratorHelper
{
    public static function generate($variant, $settings)
    {
        $pattern = $settings->barcode_pattern ?: '[N.8]';
        return preg_replace_callback(
            '/\[(PRODUCT(?:\.\d+)?|SKU|VENDOR|HANDLE|A\.\d+|N\.\d+)\]/',
            function ($match) use ($variant, $settings) {

                $token = $match[1];

                //product
                if (str_starts_with($token, 'PRODUCT')) {
                    $text = strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $variant['product_title'] ?? ''
                        )
                    );

                    if (str_contains($token, '.')) {
                        $length = (int) explode('.', $token)[1];
                        return substr($text,0,$length);
                    }
                    return $text;
                }

               
                //SKU
                if ($token == 'SKU') {
                    return strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $variant['current_sku'] ?? ''
                        )
                    );
                }

                
                //vendor
                if ($token == 'VENDOR') {

                    return strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $variant['vendor'] ?? ''
                        )
                    );
                }

                //handle
                if ($token == 'HANDLE') {
                    return strtoupper(
                        preg_replace(
                            '/[^A-Za-z0-9]/',
                            '',
                            $variant['handle'] ?? ''
                        )
                    );
                }

                //rendom Alpha
                if (str_starts_with($token,'A.')) {
                    $length = (int) explode('.',$token)[1];
                    $letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    $value='';
                    for($i=0;$i<$length;$i++){
                        $value .= $letters[random_int(0,25)];
                    }
                    return $value;
                }

                //rendoom number
                if(str_starts_with($token,'N.')){
                    $length=(int)explode('.',$token)[1];
                    $numbers='0123456789';
                    $value='';
                    for($i=0;$i<$length;$i++){
                        $value .= $numbers[random_int(0,9)];
                    }

                    //prevent Zero start end
                    if($settings->prevent_zero_start_end){
                        if($length>1){
                            if($value[0]=='0'){
                                $value[0]=random_int(1,9);
                            }
                            if($value[$length-1]=='0'){
                                $value[$length-1]=random_int(1,9);
                            }
                        }
                    }
                    return $value;
                }
                return '';
            },
            $pattern
        );
    }
}
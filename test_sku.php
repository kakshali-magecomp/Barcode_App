<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$variant = [
    'product_title' => 'Red Shirt',
    'vendor' => 'Super Vendor',
    'product_type' => 'Clothing',
    'option_1' => ' ',
    'option_2' => '',
    'option_3' => null,
];
$rules = new \stdClass();
$rules->sku_delimiter = '-';
$rules->sku_prefix = 'NEW';
$rules->segment_product_title = 'char_4';
$rules->segment_product_vendor = 'char_4';
$rules->segment_product_type = 'none';
$rules->segment_metafield = '';
$rules->segment_metafield_rule = '';
$rules->hide_options_1_2_3 = false;
$rules->segment_option1 = 'char_1';
$rules->segment_option2 = 'none';
$rules->segment_option3 = 'none';
$rules->sku_suffix = '2026';
$rules->force_uppercase_fields = true;

echo "Generated: " . \App\Helpers\SkuGeneratorHelper::generate($variant, $rules, 1005) . "\n";

<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
$skuSetting = $user->skuSetting()->first();
echo json_encode($skuSetting) . "\n";

$variant = [
    'product_title' => 'BARCODE_SKU',
    'vendor' => 'vendor',
    'product_type' => 'type',
    'option_1' => '',
    'option_2' => '',
    'option_3' => '',
];

echo "Generated: " . \App\Helpers\SkuGeneratorHelper::generate($variant, $skuSetting, 1002) . "\n";

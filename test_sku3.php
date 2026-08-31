<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::first();
$skuSetting = $user->skuSetting()->first();

$variant = [
    'options' => [
        ['position' => 1, 'value' => ''],
        ['position' => 2, 'value' => ''],
        ['position' => 3, 'value' => ''],
    ]
];
$product = [
    'title' => 'BARCODE_SKU',
    'vendor' => 'vendor',
    'product_type' => 'type',
    'metafields' => []
];

$job = new \App\Jobs\GenerateSkuJob(null, null);
$reflection = new ReflectionClass($job);
$method = $reflection->getMethod('generateSku');
$method->setAccessible(true);
echo "GenerateSkuJob: " . $method->invoke($job, $skuSetting, $product, $variant) . "\n";

$variant2 = [
    'product_title' => 'BARCODE_SKU',
    'vendor' => 'vendor',
    'product_type' => 'type',
    'option_1' => '',
    'option_2' => '',
    'option_3' => '',
];
echo "SkuGeneratorHelper: " . \App\Helpers\SkuGeneratorHelper::generate($variant2, $skuSetting, 1) . "\n";

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BarcodeTemplateController;
use App\Http\Controllers\BarcodeSettingController;
use App\Http\Controllers\SkuSettingController;
use App\Http\Controllers\ShopifyProductController;
use App\Http\Controllers\PrintSettingController;

Route::middleware(['verify.shopify'])->group(function () {

    Route::post('/templates', [BarcodeTemplateController::class, 'store']);

    Route::get('/barcode-settings',[BarcodeSettingController::class,'show']);
    Route::post('/barcode-settings',[BarcodeSettingController::class,'update']);

    Route::get('/sku-settings', [SkuSettingController::class, 'show']);
    Route::post('/sku-settings', [SkuSettingController::class, 'update']);

    Route::get('/products', [ShopifyProductController::class, 'list']);

    Route::get('/print-settings', [PrintSettingController::class, 'show']);
    Route::post('/print-settings', [PrintSettingController::class, 'update']);
    
}); 
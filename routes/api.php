<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\BarcodeTemplateController;
use App\Http\Controllers\BarcodeSettingController;
use App\Http\Controllers\SkuSettingController;
use App\Http\Controllers\ShopifyProductController;
use App\Http\Controllers\PrintSettingController;
use App\Http\Controllers\DashboardController;

Route::middleware(['verify.shopify'])->group(function () {

    Route::get('/templates', [BarcodeTemplateController::class, 'index']);
    Route::post('/templates', [BarcodeTemplateController::class, 'store']);
    Route::get('/templates/{id}', [BarcodeTemplateController::class, 'show']);       
    Route::put('/templates/{id}', [BarcodeTemplateController::class, 'update']);     
    Route::delete('/templates/{id}', [BarcodeTemplateController::class, 'destroy']);

    Route::get('/barcode-settings',[BarcodeSettingController::class,'show']);
    Route::post('/barcode-settings',[BarcodeSettingController::class,'update']);

    Route::get('/sku-settings', [SkuSettingController::class, 'show']);
    Route::post('/sku-settings', [SkuSettingController::class, 'update']);

    Route::get('/products', [ShopifyProductController::class, 'list']);
    Route::post('/products/bulk-update', [ShopifyProductController::class, 'bulkUpdate']);


    Route::get('/print-settings', [PrintSettingController::class, 'show']);
    Route::post('/print-settings', [PrintSettingController::class, 'update']);

    Route::get('/dashboard-stats', [DashboardController::class, 'index']);

    
}); 
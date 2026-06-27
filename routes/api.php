<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\LabelHistoryController;
use App\Http\Controllers\BarcodeController;

//user
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

//dashboard
Route::get('/dashboard', [DashboardController::class, 'index']);

// template
Route::get('/templates', [TemplateController::class, 'index']);

Route::post('/templates', [TemplateController::class, 'store']);

Route::post('/templates/delete', [TemplateController::class, 'deleteTemplates']);

// products
Route::get('/products', [ProductController::class, 'index']);

//label history
Route::get('/label-history', [LabelHistoryController::class, 'index']);

Route::post('/label-history', [LabelHistoryController::class, 'store']);

Route::delete('/label-history/{id}',[LabelHistoryController::class, 'destroy']);

//barcode
Route::post('/barcode/generate', [BarcodeController::class, 'generate']);

Route::get('/barcode/generate-history', [BarcodeController::class, 'generateHistory']);

Route::get('/barcode/print-history', [BarcodeController::class, 'printHistory']);
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\LabelHistoryController;
use App\Http\Controllers\BarcodeController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/dashboard', [DashboardController::class, 'index']);

Route::get('/templates', [TemplateController::class, 'index']);
Route::post('/templates', [TemplateController::class, 'store']);
Route::post('/templates/delete', [TemplateController::class, 'deleteTemplates']);

Route::get('/products', [ProductController::class, 'index']);

Route::get('/label-history', [LabelHistoryController::class, 'index']);
Route::post('/label-history', [LabelHistoryController::class, 'store']);

Route::post('/barcode/generate', [BarcodeController::class, 'generate']);
Route::get('/barcode/generate-history', [BarcodeController::class, 'generateHistory']);
Route::get('/barcode/print-history', [BarcodeController::class, 'printHistory']);
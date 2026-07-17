    <?php

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;

    use App\Http\Controllers\BarcodeTemplateController;
    use App\Http\Controllers\BarcodeSettingController;
    use App\Http\Controllers\SkuSettingController;
    use App\Http\Controllers\ShopifyProductController;
    use App\Http\Controllers\PrintSettingController;
    use App\Http\Controllers\DashboardController;
    use App\Http\Controllers\BarcodePrintController;
    use App\Http\Controllers\TemplateDesignController;
    use App\Http\Controllers\LabelHistoryController;
    use App\Http\Controllers\ProductWebhookController;


    Route::middleware(['verify.shopify'])->group(function () {

        Route::get('/templates/design/{template_id}', [TemplateDesignController::class, 'show']);
        Route::put('/templates/design/{template_id}', [TemplateDesignController::class, 'update']);

        Route::get('/templates', [BarcodeTemplateController::class, 'index']);
        Route::post('/templates', [BarcodeTemplateController::class, 'store']);
        Route::get('/templates/{id}', [BarcodeTemplateController::class, 'show']);
        Route::put('/templates/{id}', [BarcodeTemplateController::class, 'update']);
        Route::delete('/templates/{id}', [BarcodeTemplateController::class, 'destroy']);

        Route::get('/barcode-settings', [BarcodeSettingController::class, 'show']);
        Route::post('/barcode-settings', [BarcodeSettingController::class, 'update']);

        Route::get('/sku-settings', [SkuSettingController::class, 'show']);
        Route::post('/sku-settings', [SkuSettingController::class, 'update']);

        Route::get('/products', [ShopifyProductController::class, 'list']);
        Route::post('/products/bulk-update', [ShopifyProductController::class, 'bulkUpdate']);
        Route::post('/products/barcode-update', [ShopifyProductController::class, 'bulkBarcodeUpdate']);
        Route::post('/products/generate-sku',[ShopifyProductController::class, 'generateSku']);

        Route::get('/print-settings', [PrintSettingController::class, 'show']);
        Route::post('/print-settings', [PrintSettingController::class, 'update']);

        Route::get('/dashboard-stats', [DashboardController::class, 'index']);

        Route::post('/products/print-pdf', [BarcodePrintController::class, 'printToPdf']);

        Route::get('/label-history', [LabelHistoryController::class, 'index']);
        Route::get('/label-history/{id}', [LabelHistoryController::class, 'show']);
        Route::delete('/label-history/{id}', [LabelHistoryController::class, 'destroy']);


    });
        Route::post('/webhooks/products/create', [ProductWebhookController::class, 'created']);

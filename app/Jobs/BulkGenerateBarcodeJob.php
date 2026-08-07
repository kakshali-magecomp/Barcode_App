<?php

namespace App\Jobs;

use App\Helpers\BarcodeGeneratorHelper;
use App\Helpers\ShopifyQueryHelper;
use App\Models\BulkOperation;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class BulkGenerateBarcodeJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $timeout = 120;

    protected $bulkOperationId;
    protected $userId;
    protected $variants; // this chunk's variants only
    protected $method;   // 'missing' | 'replace' | 'sku'

    public function __construct($bulkOperationId, $userId, array $variants, string $method)
    {
        $this->bulkOperationId = $bulkOperationId;
        $this->userId = $userId;
        $this->variants = $variants;
        $this->method = $method;
    }

    public function handle(): void
    {
        $user = User::find($this->userId);
        $bulkOperation = BulkOperation::find($this->bulkOperationId);

        if (!$user || !$bulkOperation) {
            Log::error("BulkGenerateBarcodeJob: missing user or bulk operation", [
                'user_id' => $this->userId,
                'bulk_operation_id' => $this->bulkOperationId,
            ]);
            return;
        }

        $barcodeSetting = $user->barcodeSetting()->firstOrCreate([]);

        $groupedProducts = [];
        $updatedProducts = [];
        $failedCount = 0;

        foreach ($this->variants as $variant) {
            try {
                $oldBarcode = $variant["barcode"] ?? $variant["current_barcode"] ?? "";

                if ($this->method === "sku") {
                    $newBarcode = trim($variant["current_sku"] ?? "");
                    if ($newBarcode === "") {
                        $failedCount++;
                        continue;
                    }
                } else {
                    $newBarcode = BarcodeGeneratorHelper::generate($variant, $barcodeSetting);
                    if (empty($newBarcode)) {
                        $failedCount++;
                        continue;
                    }
                }

                $groupedProducts[$variant["product_id"]][] = [
                    "id" => $variant["variant_id"],
                    "barcode" => $newBarcode,
                ];

                $updatedProducts[] = [
                    "product_title" => $variant["product_title"] ?? "",
                    "variant_title" => $variant["variant_title"] ?? "",
                    "old_barcode" => $oldBarcode,
                    "new_barcode" => $newBarcode,
                ];
            } catch (\Exception $e) {
                Log::error("BulkGenerateBarcodeJob variant exception", ['error' => $e->getMessage()]);
                $failedCount++;
            }
        }

        // Bulk update per product (fewer API calls than one-per-variant),
        // same pattern as the original synchronous generateBarcode().
        $mutation = ShopifyQueryHelper::updateBarcode();
        foreach ($groupedProducts as $productId => $shopifyVariants) {
            try {
                $variables = ["productId" => $productId, "variants" => $shopifyVariants];
                $response = $user->api()->graph($mutation, $variables);
                $responseArray = json_decode(json_encode($response), true);
                $errors = $responseArray['body']['container']['data']['productVariantsBulkUpdate']['userErrors'] ??
                    $responseArray['body']['data']['productVariantsBulkUpdate']['userErrors'] ?? [];

                if (!empty($errors)) {
                    Log::warning("BulkGenerateBarcodeJob product failed", ['errors' => $errors, 'product_id' => $productId]);
                }
            } catch (\Exception $e) {
                Log::error("BulkGenerateBarcodeJob product exception", ['error' => $e->getMessage()]);
            }
        }

        $bulkOperation->recordChunkResult($updatedProducts, $failedCount);
    }
}
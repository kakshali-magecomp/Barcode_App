<?php

namespace App\Jobs;

use App\Helpers\ShopifyQueryHelper;
use App\Helpers\SkuGeneratorHelper;
use App\Models\BulkOperation;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class BulkGenerateSkuJob implements ShouldQueue
{
    use Queueable;

    public $tries = 3;
    public $timeout = 120;

    protected $bulkOperationId;
    protected $userId;
    protected $variants; // this chunk's variants only
    protected $method;   // 'missing' | 'replace' | 'barcode'
    protected $startingCounter; // pre-reserved counter range start for THIS chunk

    public function __construct($bulkOperationId, $userId, array $variants, string $method, int $startingCounter)
    {
        $this->bulkOperationId = $bulkOperationId;
        $this->userId = $userId;
        $this->variants = $variants;
        $this->method = $method;
        $this->startingCounter = $startingCounter;
    }

    public function handle(): void
    {
        $user = User::find($this->userId);
        $bulkOperation = BulkOperation::find($this->bulkOperationId);

        if (!$user || !$bulkOperation) {
            Log::error("BulkGenerateSkuJob: missing user or bulk operation", [
                'user_id' => $this->userId,
                'bulk_operation_id' => $this->bulkOperationId,
            ]);
            return;
        }

        $skuSetting = $user->skuSetting()->firstOrCreate([]);
        $mutation = ShopifyQueryHelper::updateInventoryItem();
        $counter = $this->startingCounter;

        $updatedProducts = [];
        $failedCount = 0;

        foreach ($this->variants as $variant) {
            try {
                $currentSku = $variant['current_sku'] ?? "";

                if ($this->method === "barcode") {
                    $newSku = trim($variant['barcode'] ?? '');
                    if ($newSku === '') {
                        $failedCount++;
                        continue;
                    }
                } else {
                    $newSku = SkuGeneratorHelper::generate($variant, $skuSetting, $counter);
                    $counter++; // only barcode-mode doesn't consume the counter
                }

                if (empty($newSku)) {
                    $failedCount++;
                    continue;
                }

                $variables = [
                    "id" => trim($variant["inventory_item_id"]),
                    "input" => ["sku" => trim($newSku)],
                ];

                $response = $user->api()->graph($mutation, $variables);
                $responseArray = json_decode(json_encode($response), true);
                $errors = $responseArray['body']['container']['data']['inventoryItemUpdate']['userErrors'] ??
                    $responseArray['body']['data']['inventoryItemUpdate']['userErrors'] ?? [];

                if (!empty($errors)) {
                    Log::warning("BulkGenerateSkuJob variant failed", ['errors' => $errors, 'variant' => $variant]);
                    $failedCount++;
                    continue;
                }

                $updatedProducts[] = [
                    "product_title" => $variant["product_title"] ?? "",
                    "variant_title" => $variant["variant_title"] ?? "",
                    "old_sku" => $currentSku,
                    "new_sku" => $newSku,
                ];
            } catch (\Exception $e) {
                Log::error("BulkGenerateSkuJob variant exception", ['error' => $e->getMessage()]);
                $failedCount++;
            }
        }

        $bulkOperation->recordChunkResult($updatedProducts, $failedCount);
    }
}
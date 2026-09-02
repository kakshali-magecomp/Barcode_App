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
                    $counter++;
                }

                if (empty($newSku)) {
                    $failedCount++;
                    continue;
                }

                $inventoryItemId = trim($variant["inventory_item_id"] ?? '');
                $productId = trim($variant["product_id"] ?? '');
                $variantId = trim($variant["variant_id"] ?? '');

                $success = false;

                // Method 1: Try inventoryItemUpdate if inventory_item_id is present
                if (!empty($inventoryItemId)) {
                    $formattedInvId = $inventoryItemId;
                    if (!str_starts_with($formattedInvId, 'gid://')) {
                        $formattedInvId = "gid://shopify/InventoryItem/" . $formattedInvId;
                    }

                    $mutation = ShopifyQueryHelper::updateInventoryItem();
                    $variables = [
                        "id" => $formattedInvId,
                        "input" => ["sku" => trim($newSku)],
                    ];

                    $response = $user->api()->graph($mutation, $variables);
                    $responseArray = json_decode(json_encode($response), true);
                    $topErrors = $responseArray['body']['errors'] ?? $responseArray['errors'] ?? null;
                    $userErrors = $responseArray['body']['data']['inventoryItemUpdate']['userErrors'] ??
                        $responseArray['data']['inventoryItemUpdate']['userErrors'] ?? [];

                    if (empty($topErrors) && empty($userErrors)) {
                        $success = true;
                    } else {
                        Log::warning("BulkGenerateSkuJob inventoryItemUpdate failed", [
                            'top_errors' => $topErrors,
                            'user_errors' => $userErrors,
                            'variant' => $variant
                        ]);
                    }
                }

                // Method 2: Try productVariantsBulkUpdate if variant_id and product_id are present
                if (!$success && !empty($productId) && !empty($variantId)) {
                    $formattedProdId = $productId;
                    if (!str_starts_with($formattedProdId, 'gid://')) {
                        $formattedProdId = "gid://shopify/Product/" . $formattedProdId;
                    }
                    $formattedVarId = $variantId;
                    if (!str_starts_with($formattedVarId, 'gid://')) {
                        $formattedVarId = "gid://shopify/ProductVariant/" . $formattedVarId;
                    }

                    $bulkMutation = ShopifyQueryHelper::updateSku();
                    $bulkVariables = [
                        "productId" => $formattedProdId,
                        "variants" => [
                            [
                                "id" => $formattedVarId,
                                "inventoryItem" => [
                                    "sku" => trim($newSku)
                                ]
                            ]
                        ]
                    ];

                    $response = $user->api()->graph($bulkMutation, $bulkVariables);
                    $responseArray = json_decode(json_encode($response), true);
                    $topErrors = $responseArray['body']['errors'] ?? $responseArray['errors'] ?? null;
                    $userErrors = $responseArray['body']['data']['productVariantsBulkUpdate']['userErrors'] ??
                        $responseArray['data']['productVariantsBulkUpdate']['userErrors'] ?? [];

                    if (empty($topErrors) && empty($userErrors)) {
                        $success = true;
                    } else {
                        Log::warning("BulkGenerateSkuJob productVariantsBulkUpdate failed", [
                            'top_errors' => $topErrors,
                            'user_errors' => $userErrors,
                            'variant' => $variant
                        ]);
                    }
                }

                if ($success) {
                    $updatedProducts[] = [
                        "variant_id" => $variant["variant_id"] ?? "",
                        "product_title" => $variant["product_title"] ?? "",
                        "variant_title" => $variant["variant_title"] ?? "",
                        "old_sku" => $currentSku,
                        "new_sku" => $newSku,
                    ];
                } else {
                    $failedCount++;
                }
            } catch (\Exception $e) {
                Log::error("BulkGenerateSkuJob variant exception", ['error' => $e->getMessage()]);
                $failedCount++;
            }
        }

        $bulkOperation->recordChunkResult($updatedProducts, $failedCount);
    }
}
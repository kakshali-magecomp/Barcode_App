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
        $updatedProducts = [];
        $failedCount = 0;

        // Group variants by product_id for productVariantsBulkUpdate mutation
        $productGroups = [];

        foreach ($this->variants as $variant) {
            $productId = trim($variant["product_id"] ?? '');
            $variantId = trim($variant["variant_id"] ?? '');

            if (empty($variantId)) {
                $failedCount++;
                continue;
            }

            $oldBarcode = $variant["barcode"] ?? $variant["current_barcode"] ?? "";

            if ($this->method === "sku") {
                $newBarcode = trim($variant["current_sku"] ?? $variant["sku"] ?? "");
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

            $formattedProdId = $productId;
            if (!empty($formattedProdId) && !str_starts_with($formattedProdId, 'gid://')) {
                $formattedProdId = "gid://shopify/Product/" . $formattedProdId;
            }

            $formattedVarId = $variantId;
            if (!str_starts_with($formattedVarId, 'gid://')) {
                $formattedVarId = "gid://shopify/ProductVariant/" . $formattedVarId;
            }

            $groupKey = !empty($formattedProdId) ? $formattedProdId : $formattedVarId;

            if (!isset($productGroups[$groupKey])) {
                $productGroups[$groupKey] = [
                    'product_id' => $formattedProdId,
                    'items' => []
                ];
            }

            $productGroups[$groupKey]['items'][] = [
                'variant_raw' => $variant,
                'formatted_var_id' => $formattedVarId,
                'old_barcode' => $oldBarcode,
                'new_barcode' => $newBarcode,
            ];
        }

        foreach ($productGroups as $groupKey => $group) {
            $productId = $group['product_id'];
            $items = $group['items'];

            $variantsInput = [];
            foreach ($items as $item) {
                $variantsInput[] = [
                    'id' => $item['formatted_var_id'],
                    'barcode' => trim($item['new_barcode']),
                ];
            }

            $success = false;

            if (!empty($productId)) {
                $bulkMutation = ShopifyQueryHelper::updateBarcode();
                $bulkVariables = [
                    "productId" => $productId,
                    "variants" => $variantsInput
                ];

                try {
                    $response = $user->api()->graph($bulkMutation, $bulkVariables);
                    $responseArray = json_decode(json_encode($response), true);

                    $topErrors = $responseArray['body']['errors'] ?? $responseArray['errors'] ?? null;
                    $userErrors = $responseArray['body']['data']['productVariantsBulkUpdate']['userErrors'] ??
                        $responseArray['data']['productVariantsBulkUpdate']['userErrors'] ?? [];

                    if (empty($topErrors) && empty($userErrors)) {
                        $success = true;
                    } else {
                        Log::warning("BulkGenerateBarcodeJob productVariantsBulkUpdate failed", [
                            'top_errors' => $topErrors,
                            'user_errors' => $userErrors,
                            'product_id' => $productId,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error("BulkGenerateBarcodeJob GraphQL exception", ['error' => $e->getMessage()]);
                }
            }

            if ($success) {
                foreach ($items as $item) {
                    $updatedProducts[] = [
                        "variant_id" => $item['variant_raw']["variant_id"] ?? "",
                        "product_title" => $item['variant_raw']["product_title"] ?? "",
                        "variant_title" => $item['variant_raw']["variant_title"] ?? "",
                        "old_barcode" => $item['old_barcode'],
                        "new_barcode" => $item['new_barcode'],
                    ];
                }
            } else {
                $failedCount += count($items);
            }
        }

        $bulkOperation->recordChunkResult($updatedProducts, $failedCount);
    }
}
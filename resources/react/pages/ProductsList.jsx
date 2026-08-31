import React, { useState, useEffect } from "react";
import { useAppBridge, TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import ProductPickerModal from "../components/ProductPickerModal";

export default function GenerateSku() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const [updatedProducts, setUpdatedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [method, setMethod] = useState("missing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(null); // { processed, total }
    const SUMMARY_PAGE_SIZE = 5;
    const [summaryPage, setSummaryPage] = useState(1);

    const generateSku = async () => {
        if (!method) {
            setError("Please choose an SKU generation method.");
            return;
        }
        if (method !== "missing" && selectedProducts.length === 0) {
            shopify.toast.show("Please select at least one product.");
            return;
        }
        try {
            setLoading(true);
            setError("");
            const payload = {
                method,
                variants:
                    method === "missing"
                        ? []
                        : selectedProducts.map(item => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            inventory_item_id: item.inventory_item_id,
                            product_title: item.product_title,
                            vendor: item.vendor,
                            product_type: item.product_type,
                            current_sku: item.current_sku,
                            barcode: item.barcode,
                            price: item.price,
                            option_1: item.option_1,
                            option_2: item.option_2,
                            option_3: item.option_3,
                            metafields: item.metafields,
                        })),
            };

            const response = await fetch("/api/products/generate-sku", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });
            const json = await response.json();

            if (!response.ok) {

                if (response.status === 422) {
                    const fieldErrors = json.errors
                        ? Object.values(json.errors).flat().join(' ')
                        : '';
                    throw new Error(json.message || fieldErrors || "Validation failed.");
                }
                throw new Error(json.message || `Server Error (${response.status})`);
            }
            if (json.generated_count === 0) {
                shopify.toast.show(json.message || "All products already have SKU.");
                setLoading(false);
                return;
            }

            // Large batches are queued — poll for progress instead of
            // blocking the request open.
            if (json.queued) {
                setProgress({ processed: 0, total: json.total });
                pollBulkOperation(json.operation_id);
                return; // setLoading(false) happens once polling completes
            }

            // Fallback for any non-queued/legacy synchronous response
            setUpdatedProducts(json.updated_products || []);
            setSelectedProducts([]);
            setPickerOpen(false);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err.message || "Server Error");
            setLoading(false);
        }
    };

    // Polls the backend every 2s until the queued job finishes.
    const pollBulkOperation = (operationId) => {
        const interval = setInterval(async () => {
            try {
                const token = await shopify.idToken();
                const res = await fetch(`/api/bulk-operations/${operationId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();

                if (!json.status) {
                    console.error("Bulk operation poll failed:", json);
                    clearInterval(interval);
                    setError(json.error || "Lost track of the generation job. Check the console for details.");
                    setLoading(false);
                    setProgress(null);
                    return;
                }

                const op = json.operation;
                setProgress({ processed: op.processed, total: op.total });

                if (op.status === "completed") {
                    clearInterval(interval);
                    setUpdatedProducts(op.updated_products || []);
                    setSelectedProducts([]);
                    setPickerOpen(false);
                    setLoading(false);
                    setProgress(null);
                    shopify.toast.show(
                        `${op.processed - op.failed} SKU generated successfully${op.failed ? `, ${op.failed} failed` : ""}.`
                    );
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };
    const totalSummaryPages = Math.max(1, Math.ceil(updatedProducts.length / SUMMARY_PAGE_SIZE));
    const summaryStart = (summaryPage - 1) * SUMMARY_PAGE_SIZE;
    const summaryEnd = summaryStart + SUMMARY_PAGE_SIZE;
    const paginatedSummary = updatedProducts.slice(summaryStart, summaryEnd);

    return (
        <>
            <TitleBar title="barcodedemo-app" />
            <s-page>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '24px' 
                }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                        Generate SKU
                    </h1>
                    <s-button icon="settings" onClick={() => navigate('/Settingindex')}></s-button>
                </div>

            {error && (
                <s-section>
                    <s-banner tone="critical" onDismiss={() => setError("")}>
                        {error}
                    </s-banner>
                </s-section>
            )}

            <s-section>
                <s-stack direction="block" gap="base">
                    <s-heading>SKU Generation Method</s-heading>
                    <s-choice-list
                        name="method"
                        label="SKU generation method"
                        labelAccessibilityVisibility="exclusive"
                        onChange={(event) => {
                            const selected = event.currentTarget.values?.[0];
                            if (selected) setMethod(selected);
                        }}
                    >
                        <s-choice value="missing" selected={method === "missing"}>
                            Only generate SKU for selected products or variants that don't have SKU
                        </s-choice>
                        <s-choice value="replace" selected={method === "replace"}>
                            Generate SKU for all selected products or variants. Replace existing SKU if already available.
                        </s-choice>
                        <s-choice value="barcode" selected={method === "barcode"}>
                            Generate SKU from barcode number
                        </s-choice>
                    </s-choice-list>

                    <s-divider />

                    <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                        <s-heading>Selected Products</s-heading>

                        {method === "missing" ? (
                            <s-text tone="subdued">
                                All products without SKU will be processed automatically.
                            </s-text>
                        ) : (
                            <s-text tone="subdued">
                                {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} selected
                            </s-text>
                        )}

                        {method !== "missing" && (
                            <s-button onClick={() => setPickerOpen(true)}>
                                Choose Products
                            </s-button>
                        )}

                        <s-button variant="primary" loading={loading || undefined} onClick={generateSku}>
                            Generate SKU
                        </s-button>
                    </s-stack>
                    {loading && progress && progress.total > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                            <s-text>Generating SKUs</s-text>
                            <div
                                role="progressbar"
                                aria-valuenow={progress.processed}
                                aria-valuemin={0}
                                aria-valuemax={progress.total}
                                aria-label={`${progress.processed} of ${progress.total} products processed`}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '999px',
                                    background: '#e1e3e5',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        width: `${Math.min(100, (progress.processed / progress.total) * 100)}%`,
                                        height: '100%',
                                        background: '#008060',
                                        borderRadius: '999px',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </div>
                            <s-text tone="subdued">
                                {progress.processed} of {progress.total} products processed
                                {progress.processed >= progress.total ? '' : '...'}
                            </s-text>
                        </div>
                    )}
                </s-stack>
            </s-section>

            {updatedProducts.length > 0 && (
                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                            <s-heading>Generated SKU Summary</s-heading>
                            {updatedProducts.length > SUMMARY_PAGE_SIZE && (
                                <s-text tone="subdued">
                                    Page {summaryPage} of {totalSummaryPages} ({updatedProducts.length} products)
                                </s-text>
                            )}
                        </s-stack>

                        {paginatedSummary.map((item, index) => (
                            <s-box key={summaryStart + index} padding="base" borderWidth="base" borderRadius="base">
                                <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="bold">{item.product_title}</s-text>
                                    {item.variant_title !== "Default Title" && (
                                        <s-text tone="subdued">{item.variant_title}</s-text>
                                    )}
                                    <s-text>
                                        Old SKU: <s-text fontWeight="bold">{item.old_sku || "-"}</s-text>
                                    </s-text>
                                    <s-text tone="success">
                                        New SKU: <s-text fontWeight="bold">{item.new_sku}</s-text>
                                    </s-text>
                                </s-stack>
                            </s-box>
                        ))}

                        {updatedProducts.length > SUMMARY_PAGE_SIZE && (
                            <s-stack direction="inline" gap="tight" alignItems="center">
                                <s-button
                                    variant="tertiary"
                                    disabled={summaryPage <= 1 || undefined}
                                    onClick={() => setSummaryPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </s-button>
                                <s-button
                                    variant="tertiary"
                                    disabled={summaryPage >= totalSummaryPages || undefined}
                                    onClick={() => setSummaryPage((p) => Math.min(totalSummaryPages, p + 1))}
                                >
                                    Next
                                </s-button>
                            </s-stack>
                        )}
                    </s-stack>
                </s-section>
            )}

            <ProductPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                alreadySelectedIds={selectedProducts.map((p) => String(p.variant_id))}
                onSelect={(products) => {
                    setSelectedProducts(products);
                    setPickerOpen(false);
                }}
            />
            </s-page>
        </>
    );
}
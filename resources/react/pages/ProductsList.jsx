import React, { useState, useEffect } from "react";
import { useAppBridge, TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

export default function GenerateSku() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const [updatedProducts, setUpdatedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [method, setMethod] = useState("missing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(null); // { processed, total }
    const SUMMARY_PAGE_SIZE = 5;
    const [summaryPage, setSummaryPage] = useState(1);

    // Row Selection & Delete Modal state
    const [selectedRowVariantIds, setSelectedRowVariantIds] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);

    const handleOpenResourcePicker = async () => {
        const pickerFn = shopify?.resourcePicker || window?.shopify?.resourcePicker;
        if (typeof pickerFn === "function") {
            try {
                const selection = await pickerFn({
                    type: "product",
                    multiple: true,
                    action: "select",
                });
                if (selection && Array.isArray(selection) && selection.length > 0) {
                    const selectedItems = [];
                    selection.forEach((p) => {
                        const pId = p.id ? String(p.id).split("/").pop() : "";
                        (p.variants || []).forEach((v) => {
                            const vId = v.id ? String(v.id).split("/").pop() : "";
                            selectedItems.push({
                                variant_id: vId,
                                product_id: pId,
                                product_title: p.title,
                                variant_title: v.title === "Default Title" ? "" : v.title,
                                option_1: v.title === "Default Title" ? "Default" : v.title,
                                sku: v.sku || "",
                                current_sku: v.sku || "",
                                barcode: v.barcode || "",
                                price: v.price || "0.00",
                                image: v.image?.src || p.images?.[0]?.src || "",
                                available: v.inventoryQuantity ?? 0,
                                inventory_quantity: v.inventoryQuantity ?? 0,
                                vendor: p.vendor || "",
                            });
                        });
                    });
                    if (selectedItems.length > 0) {
                        setSelectedProducts(selectedItems);
                    }
                }
            } catch (err) {
                console.log("User cancelled product picker or error:", err);
            }
            return;
        }

        try {
            const res = await fetch("/api/products");
            const json = await res.json();
            if (json.status && Array.isArray(json.variants)) {
                setSelectedProducts(json.variants);
            }
        } catch (err) {
            console.error("Fallback product fetch failed:", err);
        }
    };

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

            if (json.queued) {
                setProgress({ processed: 0, total: json.total });
                pollBulkOperation(json.operation_id);
                return;
            }

            setUpdatedProducts(json.updated_products || []);
            setSelectedProducts([]);
            setSelectedRowVariantIds([]);
            setPickerOpen(false);
            setLoading(false);
            shopify.toast.show("SKU generated successfully.");
        } catch (err) {
            console.error(err);
            setError(err.message || "Server Error");
            setLoading(false);
        }
    };

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
                    setSelectedRowVariantIds([]);
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

    // Selection handlers
    const toggleSelectRow = (variantId) => {
        const vIdStr = String(variantId);
        setSelectedRowVariantIds((prev) =>
            prev.includes(vIdStr) ? prev.filter((id) => id !== vIdStr) : [...prev, vIdStr]
        );
    };

    const toggleSelectAllRows = () => {
        const currentIds = selectedProducts.map((p) => String(p.variant_id));
        const allSelected =
            currentIds.length > 0 && currentIds.every((id) => selectedRowVariantIds.includes(id));
        setSelectedRowVariantIds(allSelected ? [] : currentIds);
    };

    // Delete trigger handlers
    const triggerDeleteSingle = (variantId) => {
        setItemsToDelete([String(variantId)]);
        setDeleteModalOpen(true);
    };

    const triggerDeleteBulk = () => {
        if (selectedRowVariantIds.length === 0) return;
        setItemsToDelete(selectedRowVariantIds);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        setSelectedProducts((prev) =>
            prev.filter((p) => !itemsToDelete.includes(String(p.variant_id)))
        );
        setSelectedRowVariantIds((prev) =>
            prev.filter((id) => !itemsToDelete.includes(id))
        );
        shopify.toast.show(
            `${itemsToDelete.length} product${itemsToDelete.length !== 1 ? 's' : ''} removed from list`
        );
        setDeleteModalOpen(false);
        setItemsToDelete([]);
    };

    const totalSummaryPages = Math.max(1, Math.ceil(updatedProducts.length / SUMMARY_PAGE_SIZE));
    const summaryStart = (summaryPage - 1) * SUMMARY_PAGE_SIZE;
    const summaryEnd = summaryStart + SUMMARY_PAGE_SIZE;
    const paginatedSummary = updatedProducts.slice(summaryStart, summaryEnd);

    const allRowsSelected =
        selectedProducts.length > 0 &&
        selectedProducts.every((p) => selectedRowVariantIds.includes(String(p.variant_id)));

    return (
        <>
            <TitleBar title="barcodedemo-app" />

            <DeleteConfirmationModal
                open={deleteModalOpen}
                title={`Remove ${itemsToDelete.length} product${itemsToDelete.length !== 1 ? 's' : ''}?`}
                message={`Are you sure you want to remove ${
                    itemsToDelete.length === 1
                        ? 'this product'
                        : `these ${itemsToDelete.length} products`
                } from the SKU generation list?`}
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setItemsToDelete([]);
                }}
            />

            <s-page heading="Barcode App" subheading="Generate clean, automated SKU identifiers across your product catalog.">
                {/* Header Banner */}
                <s-section>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                            padding: '16px 20px',
                            borderRadius: '12px',
                            background: 'linear-gradient(90deg, #01161d 0%, #008ba8 100%)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ width: '22px', height: '22px', color: '#008ba8' }}>
                                    <s-icon type="product" tone="inherit" size="base" />
                                </div>
                            </div>
                            <div>
                                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '16px' }}>
                                    Generate SKU Codes
                                </div>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '2px' }}>
                                    Automatically assign or update unique SKUs based on your store rules
                                </div>
                            </div>
                        </div>

                        <s-stack direction="inline" gap="base">
                            <s-button icon="settings" onClick={() => navigate('/Settingindex')}>
                                SKU Settings
                            </s-button>
                            {method === "missing" && (
                                <s-button variant="primary" loading={loading || undefined} onClick={generateSku}>
                                    Generate SKU
                                </s-button>
                            )}
                        </s-stack>
                    </div>
                </s-section>

                {error && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setError("")}>
                            {error}
                        </s-banner>
                    </s-section>
                )}

                {/* SKU Method Selection */}
                <s-section>
                    <s-box padding="base" borderWidth="base" borderRadius="base">
                        <s-stack direction="block" gap="medium">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <s-text fontWeight="bold" fontSize="medium">Choose Generation Method</s-text>
                                    <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                        Select how products should be targeted for SKU creation
                                    </div>
                                </div>
                            </div>

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
                                    <div>
                                        <strong>Missing SKUs Only</strong>
                                        <div style={{ color: '#616161', fontSize: '12px', marginTop: '2px' }}>
                                            Scan all products in store and only generate SKUs for items without existing SKU values.
                                        </div>
                                    </div>
                                </s-choice>
                                <s-choice value="replace" selected={method === "replace"}>
                                    <div>
                                        <strong>Selected Products (Replace / Create)</strong>
                                        <div style={{ color: '#616161', fontSize: '12px', marginTop: '2px' }}>
                                            Generate SKUs for manually selected products. Overwrite any existing SKUs with newly formatted values.
                                        </div>
                                    </div>
                                </s-choice>
                                <s-choice value="barcode" selected={method === "barcode"}>
                                    <div>
                                        <strong>From Barcode Value</strong>
                                        <div style={{ color: '#616161', fontSize: '12px', marginTop: '2px' }}>
                                            Copy product barcode values into SKU field for selected items.
                                        </div>
                                    </div>
                                </s-choice>
                            </s-choice-list>
                        </s-stack>
                    </s-box>
                </s-section>

                {/* Progress Bar (when bulk job running) */}
                {loading && progress && progress.total > 0 && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="tight">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <s-text fontWeight="bold">Generating SKUs in progress...</s-text>
                                    <s-badge tone="info">{progress.processed} / {progress.total}</s-badge>
                                </div>
                                <div
                                    role="progressbar"
                                    aria-valuenow={progress.processed}
                                    aria-valuemin={0}
                                    aria-valuemax={progress.total}
                                    aria-label={`${progress.processed} of ${progress.total} products processed`}
                                    style={{
                                        width: '100%',
                                        height: '10px',
                                        borderRadius: '999px',
                                        background: '#e1e3e5',
                                        overflow: 'hidden',
                                        marginTop: '6px'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.min(100, (progress.processed / progress.total) * 100)}%`,
                                            height: '100%',
                                            background: '#008ba8',
                                            borderRadius: '999px',
                                            transition: 'width 0.3s ease',
                                        }}
                                    />
                                </div>
                                <s-text tone="subdued" fontSize="small">
                                    Processing products... Please leave this tab open until batch completion.
                                </s-text>
                            </s-stack>
                        </s-box>
                    </s-section>
                )}

                {/* Selected Products Table / List */}
                {method !== "missing" && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="medium">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <s-text fontWeight="bold">Selected Products ({selectedProducts.length})</s-text>
                                        <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                            Products chosen for SKU generation
                                        </div>
                                    </div>
                                    {selectedRowVariantIds.length > 0 && (
                                        <s-button tone="critical" onClick={triggerDeleteBulk}>
                                            Delete selected ({selectedRowVariantIds.length})
                                        </s-button>
                                    )}
                                </div>

                                {selectedProducts.length === 0 ? (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            padding: '24px 16px',
                                            background: '#f6f6f7',
                                            borderRadius: '8px',
                                            border: '1px dashed #c9cccf'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: '#202223', marginBottom: '4px' }}>
                                            No products selected yet
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6d7175', marginBottom: '12px' }}>
                                            Click "Choose Products" to select catalog items for SKU creation.
                                        </div>
                                        <s-button variant="secondary" onClick={handleOpenResourcePicker}>
                                            Choose Products
                                        </s-button>
                                    </div>
                                ) : (
                                    <>
                                        <s-table>
                                            <s-table-header-row>
                                                <s-table-header>
                                                    <s-checkbox
                                                        label="Select all"
                                                        labelAccessibilityVisibility="exclusive"
                                                        checked={allRowsSelected || undefined}
                                                        onChange={toggleSelectAllRows}
                                                    />
                                                </s-table-header>
                                                <s-table-header>Product Title</s-table-header>
                                                <s-table-header>Variant / Option</s-table-header>
                                                <s-table-header>Vendor</s-table-header>
                                                <s-table-header>Current SKU</s-table-header>
                                                <s-table-header>Action</s-table-header>
                                            </s-table-header-row>
                                            <s-table-body>
                                                {selectedProducts.map((p) => {
                                                    const isChecked = selectedRowVariantIds.includes(String(p.variant_id));
                                                    return (
                                                        <s-table-row key={p.variant_id}>
                                                            <s-table-cell>
                                                                <s-checkbox
                                                                    label={`Select ${p.product_title}`}
                                                                    labelAccessibilityVisibility="exclusive"
                                                                    checked={isChecked || undefined}
                                                                    onChange={() => toggleSelectRow(p.variant_id)}
                                                                />
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-text fontWeight="bold">{p.product_title}</s-text>
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-text tone="subdued">{p.option_1 || "Default"}</s-text>
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-badge tone="info">{p.vendor || "N/A"}</s-badge>
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                {p.current_sku ? (
                                                                    <s-text fontWeight="bold">{p.current_sku}</s-text>
                                                                ) : (
                                                                    <s-badge tone="attention">No SKU</s-badge>
                                                                )}
                                                            </s-table-cell>
                                                            <s-table-cell>
                                                                <s-button
                                                                    icon="delete"
                                                                    variant="tertiary"
                                                                    tone="critical"
                                                                    onClick={() => triggerDeleteSingle(p.variant_id)}
                                                                />
                                                            </s-table-cell>
                                                        </s-table-row>
                                                    );
                                                })}
                                            </s-table-body>
                                        </s-table>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                                            <s-button onClick={handleOpenResourcePicker}>
                                                Choose Products ({selectedProducts.length})
                                            </s-button>
                                            <s-button
                                                variant="primary"
                                                loading={loading || undefined}
                                                onClick={generateSku}
                                            >
                                                Generate SKU
                                            </s-button>
                                        </div>
                                    </>
                                )}
                            </s-stack>
                        </s-box>
                    </s-section>
                )}

                {/* Generated SKU Summary Table */}
                {updatedProducts.length > 0 && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="medium">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <s-text fontWeight="bold" fontSize="medium">Generated SKU Results</s-text>
                                        <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                            Successfully updated {updatedProducts.length} product SKU codes
                                        </div>
                                    </div>
                                    {updatedProducts.length > SUMMARY_PAGE_SIZE && (
                                        <s-text tone="subdued">
                                            Page {summaryPage} of {totalSummaryPages}
                                        </s-text>
                                    )}
                                </div>

                                <s-table
                                    paginate={updatedProducts.length > SUMMARY_PAGE_SIZE || undefined}
                                    hasPreviousPage={summaryPage > 1 || undefined}
                                    hasNextPage={summaryPage < totalSummaryPages || undefined}
                                    onPreviousPage={() => setSummaryPage((p) => Math.max(1, p - 1))}
                                    onNextPage={() => setSummaryPage((p) => Math.min(totalSummaryPages, p + 1))}
                                >
                                    <s-table-header-row>
                                        <s-table-header>Product Title</s-table-header>
                                        <s-table-header>Variant</s-table-header>
                                        <s-table-header>Previous SKU</s-table-header>
                                        <s-table-header>New Generated SKU</s-table-header>
                                        <s-table-header>Status</s-table-header>
                                    </s-table-header-row>
                                    <s-table-body>
                                        {paginatedSummary.map((item, index) => (
                                            <s-table-row key={summaryStart + index}>
                                                <s-table-cell>
                                                    <s-text fontWeight="bold">{item.product_title}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-text tone="subdued">{item.variant_title || "Default Title"}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-text tone="subdued">{item.old_sku || "-"}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-text fontWeight="bold" tone="success">{item.new_sku}</s-text>
                                                </s-table-cell>
                                                <s-table-cell>
                                                    <s-badge tone="success">Generated</s-badge>
                                                </s-table-cell>
                                            </s-table-row>
                                        ))}
                                    </s-table-body>
                                </s-table>
                            </s-stack>
                        </s-box>
                    </s-section>
                )}
            </s-page>
        </>
    );
}
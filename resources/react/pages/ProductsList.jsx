import React, { useState, useEffect } from "react";
import { useAppBridge, TitleBar } from "@shopify/app-bridge-react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import ProductPickerModal from "../components/ProductPickerModal";

export default function GenerateSku() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const [updatedProducts, setUpdatedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [method, setMethod] = useState("missing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [progress, setProgress] = useState(null); // { processed, total }
    const [skuSettings, setSkuSettings] = useState(null);
    const [printSettings, setPrintSettings] = useState(null);
    const SUMMARY_PAGE_SIZE = 5;
    const [summaryPage, setSummaryPage] = useState(1);

    // Selected products pagination & search state
    const [selectedPage, setSelectedPage] = useState(1);
    const [selectedPageSize, setSelectedPageSize] = useState("10");
    const [selectedSearchQuery, setSelectedSearchQuery] = useState("");

    // Row Selection & Delete Modal state
    const [selectedRowVariantIds, setSelectedRowVariantIds] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);

    useEffect(() => {
        const fetchSkuSettings = async () => {
            try {
                const token = await shopify.idToken();
                const res = await fetch("/api/sku-settings", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                const data = json.data || json;
                if (data && typeof data === "object") {
                    setSkuSettings(data);
                }
            } catch (err) {
                console.error("Failed to fetch SKU settings:", err);
            }
        };
        const fetchPrintSettings = async () => {
            try {
                const res = await fetch("/api/print-settings");
                const json = await res.json();
                if (json.success) {
                    setPrintSettings(json.settings);
                }
            } catch (err) {
                console.error("Failed to fetch print settings:", err);
            }
        };
        fetchSkuSettings();
        fetchPrintSettings();
    }, [shopify]);

    const getPreviewSku = (item, index) => {
        if (method === "barcode") {
            return item.barcode ? item.barcode : "No Barcode";
        }
        if (!skuSettings) return "Loading...";

        const delimiter = skuSettings.sku_delimiter || "-";
        const segments = [];

        const addCleanedSegment = (val) => {
            let value = String(val || "").trim();
            if (!value) return;
            const escapedDelim = delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            value = value.replace(/[^A-Za-z0-9]+/g, delimiter).replace(new RegExp(`^${escapedDelim}+|${escapedDelim}+$`, 'g'), '');
            if (value) segments.push(value);
        };

        const appendSegment = (val, mode) => {
            if (!mode || mode === "none" || mode === "disabled") return;
            let value = String(val || "").trim();
            if (!value || /^default([\s_-]*title)?$/i.test(value)) return;

            let chunk = "";
            if (mode === "full") chunk = value;
            else if (mode === "char_1") chunk = value.substring(0, 1);
            else if (mode === "char_2") chunk = value.substring(0, 2);
            else if (mode === "char_3") chunk = value.substring(0, 3);
            else if (mode === "char_4") chunk = value.substring(0, 4);

            addCleanedSegment(chunk);
        };

        // Prefix
        if (skuSettings.sku_prefix) {
            addCleanedSegment(skuSettings.sku_prefix);
        }

        // Product title
        appendSegment(item.product_title, skuSettings.segment_product_title);

        // Vendor
        appendSegment(item.vendor, skuSettings.segment_product_vendor);

        // Product type
        appendSegment(item.product_type, skuSettings.segment_product_type);

        // Options
        if (!skuSettings.hide_options_1_2_3) {
            appendSegment(item.option_1, skuSettings.segment_option1);
            appendSegment(item.option_2, skuSettings.segment_option2);
            appendSegment(item.option_3, skuSettings.segment_option3);
        }

        // Auto Number
        const startNum = parseInt(skuSettings.sku_auto_number_start || "1001", 10);
        addCleanedSegment(startNum + index);

        // Suffix
        if (skuSettings.sku_suffix) {
            addCleanedSegment(skuSettings.sku_suffix);
        }

        let sku = segments.join(delimiter);
        if (skuSettings.force_uppercase_fields !== false) {
            sku = sku.toUpperCase();
        }
        return sku;
    };

    const handleOpenResourcePicker = async () => {
        let currentPrintSettings = printSettings;
        if (!currentPrintSettings) {
            try {
                const res = await fetch("/api/print-settings");
                const json = await res.json();
                if (json.success) {
                    currentPrintSettings = json.settings;
                    setPrintSettings(json.settings);
                }
            } catch (err) {
                console.error("Failed to fetch print settings for resource picker:", err);
            }
        }

        const filterOpts = {};
        if (currentPrintSettings?.hide_product_draft) {
            filterOpts.draft = false;
        }
        if (currentPrintSettings?.hide_product_archived) {
            filterOpts.archived = false;
        }

        const pickerFn = shopify?.resourcePicker || window?.shopify?.resourcePicker;
        if (typeof pickerFn === "function") {
            try {
                const initialSelection = Array.from(
                    new Set(selectedProducts.map((p) => p.product_id).filter(Boolean))
                ).map((pId) => ({
                    id: String(pId).startsWith("gid://") ? String(pId) : `gid://shopify/Product/${pId}`,
                }));

                const pickerOptions = {
                    type: "product",
                    multiple: true,
                    action: "select",
                    selectionIds: initialSelection.length > 0 ? initialSelection : undefined,
                };
                if (Object.keys(filterOpts).length > 0) {
                    pickerOptions.filter = filterOpts;
                }

                const selection = await pickerFn(pickerOptions);
                if (selection && Array.isArray(selection) && selection.length > 0) {
                    const selectedItems = [];
                    selection.forEach((p) => {
                        const pId = p.id ? String(p.id).split("/").pop() : "";
                        (p.variants || []).forEach((v) => {
                            const vId = v.id ? String(v.id).split("/").pop() : "";
                            const invId = v.inventoryItem?.id ? String(v.inventoryItem.id).split("/").pop() : "";
                            const isDefault = !v.title || v.title.toLowerCase() === "default title" || v.title.toLowerCase() === "default";
                            selectedItems.push({
                                variant_id: vId,
                                product_id: pId,
                                inventory_item_id: invId,
                                product_title: p.title,
                                variant_title: isDefault ? "" : v.title,
                                option_1: isDefault ? "" : v.title,
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
                    if (currentPrintSettings?.sort_by_sku) {
                        selectedItems.sort((a, b) =>
                            (a.current_sku || a.sku || "").localeCompare(b.current_sku || b.sku || "", undefined, { numeric: true, sensitivity: 'base' })
                        );
                    }
                    if (selectedItems.length > 0) {
                        setSelectedProducts(selectedItems);
                        setUpdatedProducts([]);
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
                let variants = json.variants;
                if (currentPrintSettings?.hide_product_draft) {
                    variants = variants.filter(v => (v.status || '').toLowerCase() !== 'draft');
                }
                if (currentPrintSettings?.hide_product_archived) {
                    variants = variants.filter(v => (v.status || '').toLowerCase() !== 'archived');
                }
                if (currentPrintSettings?.sort_by_sku) {
                    variants.sort((a, b) =>
                        (a.current_sku || a.sku || "").localeCompare(b.current_sku || b.sku || "", undefined, { numeric: true, sensitivity: 'base' })
                    );
                }
                setSelectedProducts(variants);
                setUpdatedProducts([]);
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

            const updated = json.updated_products || [];
            setUpdatedProducts(updated);
            if (updated.length > 0) {
                setSelectedProducts(prev =>
                    prev.map(product => {
                        const found = updated.find(p =>
                            (p.variant_title === product.variant_title || (!p.variant_title && !product.variant_title)) &&
                            p.product_title === product.product_title
                        );
                        return found ? { ...product, sku: found.new_sku, current_sku: found.new_sku } : product;
                    })
                );
            }
            setSelectedRowVariantIds([]);
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

                if (op.status === "completed" || op.status === "failed" || op.processed >= op.total) {
                    clearInterval(interval);
                    const updated = op.updated_products || [];
                    setUpdatedProducts(updated);
                    if (updated.length > 0) {
                        setSelectedProducts(prev =>
                            prev.map(product => {
                                const found = updated.find(p =>
                                    (p.variant_id && String(p.variant_id) === String(product.variant_id)) ||
                                    ((p.variant_title === product.variant_title || (!p.variant_title && !product.variant_title)) &&
                                        p.product_title === product.product_title)
                                );
                                return found ? { ...product, sku: found.new_sku, current_sku: found.new_sku } : product;
                            })
                        );
                    }
                    setSelectedRowVariantIds([]);
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

    // Filter selected products by search query
    const filteredSelectedProducts = selectedProducts.filter((item) => {
        if (!selectedSearchQuery.trim()) return true;
        const q = selectedSearchQuery.toLowerCase();
        return (
            (item.product_title && item.product_title.toLowerCase().includes(q)) ||
            (item.variant_title && item.variant_title.toLowerCase().includes(q)) ||
            (item.option_1 && item.option_1.toLowerCase().includes(q)) ||
            (item.current_sku && item.current_sku.toLowerCase().includes(q)) ||
            (item.vendor && item.vendor.toLowerCase().includes(q)) ||
            (item.barcode && item.barcode.toLowerCase().includes(q))
        );
    });

    const effectivePageSize = selectedPageSize === "all" ? filteredSelectedProducts.length || 1 : Number(selectedPageSize);
    const totalSelectedPages = Math.max(1, Math.ceil(filteredSelectedProducts.length / effectivePageSize));
    const paginatedStartIndex = (selectedPage - 1) * effectivePageSize;
    const paginatedSelectedProducts = filteredSelectedProducts.slice(
        paginatedStartIndex,
        paginatedStartIndex + effectivePageSize
    );

    useEffect(() => {
        if (selectedPage > totalSelectedPages) {
            setSelectedPage(totalSelectedPages);
        }
    }, [filteredSelectedProducts.length, selectedPage, totalSelectedPages]);

    const totalSummaryPages = Math.max(1, Math.ceil(updatedProducts.length / SUMMARY_PAGE_SIZE));
    const summaryStart = (summaryPage - 1) * SUMMARY_PAGE_SIZE;
    const summaryEnd = summaryStart + SUMMARY_PAGE_SIZE;
    const paginatedSummary = updatedProducts.slice(summaryStart, summaryEnd);

    const allRowsSelected =
        filteredSelectedProducts.length > 0 &&
        filteredSelectedProducts.every((p) => selectedRowVariantIds.includes(String(p.variant_id)));

    return (
        <>
            <TitleBar title="barcodedemo-app" />

            <DeleteConfirmationModal
                open={deleteModalOpen}
                title={`Remove ${itemsToDelete.length} product${itemsToDelete.length !== 1 ? 's' : ''}?`}
                message={`Are you sure you want to remove ${itemsToDelete.length === 1
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
                                Go to Settings
                            </s-button>
                            {method === "missing" && (
                                <s-button
                                    key={loading ? 'sku-btn-loading-top' : 'sku-btn-idle-top'}
                                    variant="primary"
                                    loading={loading}
                                    onClick={generateSku}
                                >
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
                    <div
                        style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Choose Generation Method</span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Select how products are targeted for SKU creation</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                            {[
                                { value: 'missing', label: 'Missing SKUs Only', desc: 'Generate SKUs only for items without existing SKU values.' },
                                { value: 'replace', label: 'Selected Products', desc: 'Generate & overwrite SKUs for manually selected items.' },
                                { value: 'barcode', label: 'From Barcode Value', desc: 'Copy product barcode value into SKU field for selected items.' },
                            ].map((opt) => {
                                const isActive = method === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => setMethod(opt.value)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            background: isActive ? '#f0f9ff' : '#f8fafc',
                                            border: isActive ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                                            boxShadow: isActive ? '0 4px 12px rgba(2, 132, 199, 0.08)' : 'none',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="radio"
                                                name="sku-method"
                                                value={opt.value}
                                                checked={isActive}
                                                onChange={() => setMethod(opt.value)}
                                                style={{ accentColor: '#0284c7', margin: 0, cursor: 'pointer' }}
                                            />
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: isActive ? '#0369a1' : '#1e293b' }}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', paddingLeft: '20px', lineHeight: 1.3 }}>
                                            {opt.desc}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {method === "replace" && (
                            <div style={{ marginTop: '12px' }}>
                                <s-banner tone="warning">
                                    <strong>Warning:</strong> Existing SKUs will be replaced with newly generated values.
                                </s-banner>
                            </div>
                        )}
                    </div>
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
                {method !== "missing" && updatedProducts.length === 0 && (
                    <s-section>
                        <s-box padding="base" borderWidth="base" borderRadius="base">
                            <s-stack direction="block" gap="medium">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <s-text fontWeight="bold">Selected Products ({selectedProducts.length})</s-text>
                                        <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                            Review items, compare current SKUs with new generated previews, and filter selection.
                                        </div>
                                    </div>
                                    <s-stack direction="inline" gap="tight">
                                        {selectedRowVariantIds.length > 0 && (
                                            <s-button tone="critical" onClick={triggerDeleteBulk}>
                                                Delete selected ({selectedRowVariantIds.length})
                                            </s-button>
                                        )}
                                        {selectedProducts.length > 0 && (
                                            <s-button onClick={handleOpenResourcePicker}>
                                                Choose Products ({selectedProducts.length})
                                            </s-button>
                                        )}
                                    </s-stack>
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
                                        {/* Search & Pagination Filter Bar */}
                                        <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                                            <s-grid gridTemplateColumns="1fr 200px" gap="base" alignment="center">
                                                <s-text-field
                                                    placeholder="Search selected items by title, SKU, variant, vendor..."
                                                    value={selectedSearchQuery}
                                                    onInput={(e) => {
                                                        setSelectedSearchQuery(e.currentTarget.value);
                                                        setSelectedPage(1);
                                                    }}
                                                />
                                                <s-select
                                                    label="Items per page"
                                                    labelAccessibilityVisibility="exclusive"
                                                    value={selectedPageSize}
                                                    onChange={(e) => {
                                                        setSelectedPageSize(e.currentTarget.value);
                                                        setSelectedPage(1);
                                                    }}
                                                >
                                                    <s-option value="5">5 per page</s-option>
                                                    <s-option value="10">10 per page</s-option>
                                                    <s-option value="25">25 per page</s-option>
                                                    <s-option value="50">50 per page</s-option>
                                                    <s-option value="all">Show All ({filteredSelectedProducts.length})</s-option>
                                                </s-select>
                                            </s-grid>
                                        </div>

                                        {filteredSelectedProducts.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '24px', color: '#6d7175' }}>
                                                No selected products matching "{selectedSearchQuery}".
                                            </div>
                                        ) : (
                                            <>
                                                <s-table
                                                    paginate={filteredSelectedProducts.length > (effectivePageSize || 1) || undefined}
                                                    hasPreviousPage={selectedPage > 1 || undefined}
                                                    hasNextPage={selectedPage < totalSelectedPages || undefined}
                                                    onPreviousPage={() => setSelectedPage((p) => Math.max(1, p - 1))}
                                                    onNextPage={() => setSelectedPage((p) => Math.min(totalSelectedPages, p + 1))}
                                                >
                                                    <s-table-header-row>
                                                        <s-table-header>
                                                            <s-checkbox
                                                                label="Select all"
                                                                labelAccessibilityVisibility="exclusive"
                                                                checked={allRowsSelected || undefined}
                                                                onChange={toggleSelectAllRows}
                                                            />
                                                        </s-table-header>
                                                        <s-table-header>Product</s-table-header>
                                                        <s-table-header>Variant / Option</s-table-header>
                                                        <s-table-header>Vendor</s-table-header>
                                                        <s-table-header>Current SKU</s-table-header>
                                                        <s-table-header>New SKU Preview</s-table-header>
                                                        <s-table-header>Action</s-table-header>
                                                    </s-table-header-row>
                                                    <s-table-body>
                                                        {paginatedSelectedProducts.map((p, idx) => {
                                                            const globalIndex = paginatedStartIndex + idx;
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
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                            {p.image ? (
                                                                                <img
                                                                                    src={p.image}
                                                                                    alt={p.product_title}
                                                                                    style={{
                                                                                        width: '32px',
                                                                                        height: '32px',
                                                                                        borderRadius: '6px',
                                                                                        objectFit: 'cover',
                                                                                        border: '1px solid #e1e3e5'
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <div
                                                                                    style={{
                                                                                        width: '32px',
                                                                                        height: '32px',
                                                                                        borderRadius: '6px',
                                                                                        background: '#f1f2f3',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'center',
                                                                                    }}
                                                                                >
                                                                                    <s-icon type="product" tone="subdued" size="small" />
                                                                                </div>
                                                                            )}
                                                                            <s-text fontWeight="bold">{p.product_title}</s-text>
                                                                        </div>
                                                                    </s-table-cell>
                                                                    <s-table-cell>
                                                                        <s-text tone="subdued">{p.option_1 || p.variant_title || "Default"}</s-text>
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
                                                                        <s-text fontWeight="bold" tone="success">
                                                                            {getPreviewSku(p, globalIndex)}
                                                                        </s-text>
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

                                                {/* Page Range Info Footer */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '8px' }}>
                                                    <s-text tone="subdued" fontSize="small">
                                                        Showing {paginatedStartIndex + 1}–{Math.min(paginatedStartIndex + effectivePageSize, filteredSelectedProducts.length)} of {filteredSelectedProducts.length} items (Page {selectedPage} of {totalSelectedPages})
                                                    </s-text>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <s-button
                                                            key={loading ? 'sku-btn-loading-bottom' : 'sku-btn-idle-bottom'}
                                                            variant="primary"
                                                            loading={loading}
                                                            onClick={generateSku}
                                                        >
                                                            Generate SKU
                                                        </s-button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <s-text fontWeight="bold" fontSize="medium">Generated SKU Results</s-text>
                                        <div style={{ fontSize: '13px', color: '#616161', marginTop: '2px' }}>
                                            Successfully updated {updatedProducts.length} product SKU codes
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {updatedProducts.length > SUMMARY_PAGE_SIZE && (
                                            <s-text tone="subdued">
                                                Page {summaryPage} of {totalSummaryPages}
                                            </s-text>
                                        )}
                                        <s-button variant="primary" onClick={handleOpenResourcePicker}>
                                            Choose Products
                                        </s-button>
                                    </div>
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
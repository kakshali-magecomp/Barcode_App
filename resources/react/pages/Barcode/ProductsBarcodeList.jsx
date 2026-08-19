import React, { useState, useEffect, useRef } from "react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import ProductPickerModal from "../../components/ProductPickerModal";
import BarcodeRenderer from "../../components/BarcodeRenderer";
import QrCodeRenderer from "../../components/QrCodeRenderer";
import TablePreview from "../../components/TablePreview";
import TemplateLabelRenderer from "../../components/TemplateLabelRenderer"
import { openPrintWindow } from "../../components/Printlayout";

import { useNavigate, useLocation } from "react-router-dom";

const PREVIEW_PAGE_SIZE = 6;
const SUMMARY_PAGE_SIZE = 5;
const REMOVE_PRODUCT_MODAL_ID = "remove-product-modal";
const REMOVE_ALL_MODAL_ID = "remove-all-products-modal";

export default function GenerateBarcode() {
    const shopify = useAppBridge();
    const location = useLocation();
    const {
        fromHistory = false,
        historyId = null,
        mode = "missing",
        selectedProducts: historySelectedProducts = [],
        originalHistoryProducts = [],
        templateId = null,
    } = location.state || {};
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [originalProducts, setOriginalProducts] = useState([]);
    const [progress, setProgress] = useState(null); // { processed, total }
    const [summaryPage, setSummaryPage] = useState(1);
    const [method, setMethod] = useState("");
    const [previewItem, setPreviewItem] = useState(null);
    const [previewPage, setPreviewPage] = useState(1);
    const [productToRemove, setProductToRemove] = useState(null);
    const [previewMode, setPreviewMode] = useState("card");

    useEffect(() => {
        if (!fromHistory) return;
        setMethod("print");
        setOriginalProducts(originalHistoryProducts);
        const products = historySelectedProducts.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_title: item.product_title,
            barcode: item.barcode,
            barcode_format: item.barcode_format,
            online_url: item.online_url,
            current_sku: item.current_sku ?? item.sku,
            price: item.price,
            vendor: item.vendor,
            variant_title: item.variant_title,
            option_1: item.option_1,
            option_2: item.option_2,
            option_3: item.option_3,
            quantity:
                item.qty ??
                item.quantity ??
                printSettings?.default_print_label_quantity ??
                1,
        }));
        let list = [...products];

        if (printSettings?.sort_by_sku) {
            list.sort((a, b) =>
                (a.current_sku || "").localeCompare(b.current_sku || "")
            );
        }

        setSelectedProducts(list);
    }, [fromHistory, historySelectedProducts, originalHistoryProducts]);

    const updateProductQuantity = (variantId, qty) => {
        setSelectedProducts((prev) =>
            prev.map((item) =>
                item.variant_id === variantId
                    ? { ...item, quantity: Math.max(1, Number(qty)) }
                    : item
            )
        );
    };

    const [generatedProducts, setGeneratedProducts] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const printRef = useRef();
    const printContainerRef = useRef(null);
    const [templates, setTemplates] = useState([]);
    const [templateDesign, setTemplateDesign] = useState(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [printSettings, setPrintSettings] = useState(null);


    useEffect(() => {
        async function loadTemplates() {
            try {
                const res = await fetch("/api/templates");
                const json = await res.json();
                if (json.success) {
                    setTemplates(json.data || []);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadTemplates();
    }, []);

    useEffect(() => {
        async function loadPrintSettings() {
            try {
                const res = await fetch("/api/print-settings");
                const json = await res.json();
                if (json.success) {
                    setPrintSettings(json.settings);
                }
            } catch (err) {
                console.log(err);
            }
        }
        loadPrintSettings();
    }, []);

    useEffect(() => {
        if (!printSettings) return;
        if (!fromHistory) {
            setMethod(printSettings.default_generate_option || "missing");
        }
    }, [printSettings, fromHistory]);

    useEffect(() => {
        if (!fromHistory) return;
        if (!templateId) return;
        if (templates.length === 0) return;
        handleTemplateChange(templateId);
    }, [templates, templateId, fromHistory]);

    useEffect(() => {
        const totalPreviewPages = Math.max(1, Math.ceil(selectedProducts.length / PREVIEW_PAGE_SIZE));
        if (previewPage > totalPreviewPages) setPreviewPage(totalPreviewPages);
    }, [selectedProducts.length, previewPage]);

    const handleTemplateChange = async (value) => {
        setSelectedTemplate(String(value));
        if (!value) {
            setTemplateDesign(null);
            return;
        }
        try {
            setLoadingTemplate(true);
            const response = await fetch(`/api/templates/design/${value}`);
            const json = await response.json();
            if (json.success) {
                setTemplateDesign(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTemplate(false);
        }
    };

    const savePrintHistory = async () => {
        try {
            console.log("DEBUG selectedProducts vendor check:", selectedProducts.map(p => ({ title: p.product_title, vendor: p.vendor })));
            const response = await fetch("/api/print-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template_id: Number(selectedTemplate),
                    products: selectedProducts.map(product => ({
                        product_id: product.product_id ?? null,
                        variant_id: product.variant_id,
                        product_title: product.product_title,
                        current_sku: product.current_sku,
                        barcode: product.barcode,
                        barcode_format: templateDesign?.barcode_format ?? product.barcode_format ?? "CODE128",
                        template_settings: templateDesign,
                        online_url: product.online_url,
                        price: product.price,
                        vendor: product.vendor,
                        variant_title: product.variant_title,
                        option_1: product.option_1,
                        option_2: product.option_2,
                        option_3: product.option_3,
                        qty: product.quantity,
                    }))
                }),
            });
            await response.json();
        } catch (err) {
            console.error(err);
        }
    };

    const generateBarcode = async () => {
        if (method !== "missing" && selectedProducts.length === 0) {
            shopify.toast.show("Please select at least one product.");
            return;
        }
        try {
            setLoading(true);
            setError("");
            const requestData = {
                method,
                variants:
                    method === "missing"
                        ? []
                        : selectedProducts.map((item) => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            inventory_item_id: item.inventory_item_id,
                            product_title: item.product_title,
                            variant_title: item.variant_title,
                            vendor: item.vendor,
                            product_type: item.product_type,
                            current_sku: item.current_sku,
                            barcode: item.barcode,
                            online_url: item.online_url,
                            price: item.price,
                            option_1: item.option_1,
                            option_2: item.option_2,
                            option_3: item.option_3,
                            metafields: item.metafields,
                        })),
            };
            const response = await fetch("/api/products/generate-barcode", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(requestData),
            });
            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.error || json.message || "Unable to generate barcode.");
            }
            if (json.status !== 1) {
                throw new Error(json.error || json.message || "Barcode generation failed.");
            }

            if (json.generated_count === 0) {
                shopify.toast.show(json.message || "Nothing to generate.");
                setLoading(false);
                return;
            }

            if (json.queued) {
                setProgress({ processed: 0, total: json.total });
                pollBarcodeBulkOperation(json.operation_id);
                return; // setLoading(false) happens once polling completes
            }

            const updatedProducts = json.updated_products || [];
            setGeneratedProducts(updatedProducts);
            setSelectedProducts(prev =>
                prev.map(product => {
                    const updated = updatedProducts.find(p => p.variant_id === product.variant_id);
                    if (!updated) return product;
                    return {
                        ...product,
                        barcode: updated.generated_barcode ?? updated.barcode,
                        generated_barcode: updated.generated_barcode ?? updated.barcode,
                        online_url: updated.online_url ?? product.online_url,
                        barcode_format: updated.barcode_format ?? product.barcode_format,
                    };
                })
            );

            setPickerOpen(false);
            setLoading(false);
        } catch (err) {
            console.error("Generate Barcode Error:", err);
            setError(err.message || "Something went wrong while generating barcode.");
            shopify.toast.show(err.message || "Server Error");
            setLoading(false);
        }
    };
    const pollBarcodeBulkOperation = (operationId) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/bulk-operations/${operationId}`);
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
                    setProgress({ processed: op.total, total: op.total });
                    await new Promise((resolve) => setTimeout(resolve, 600));
                    setGeneratedProducts(op.updated_products || []);
                    setSelectedProducts(prev =>
                        prev.map(product => {
                            const updated = (op.updated_products || []).find(p => p.variant_title === product.variant_title && p.product_title === product.product_title);
                            return updated ? { ...product, barcode: updated.new_barcode } : product;
                        })
                    );
                    setPickerOpen(false);
                    setLoading(false);
                    setProgress(null);
                    shopify.toast.show(
                        `${op.processed - op.failed} barcode generated successfully${op.failed ? `, ${op.failed} failed` : ""}.`
                    );
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 2000);
    };
    const requestRemoveProduct = (variantId) => {
        setProductToRemove(variantId);
        shopify.modal.show(REMOVE_PRODUCT_MODAL_ID);
    };
    const confirmRemoveProduct = () => {
        if (!productToRemove) return;
        setSelectedProducts((prevProducts) =>
            prevProducts.filter((product) => product.variant_id !== productToRemove)
        );
        if (selectedProducts.length === 1) {
            setPreviewItem(null);
        }
        setProductToRemove(null);
        shopify.modal.hide(REMOVE_PRODUCT_MODAL_ID);
    };
    const requestRemoveAllProducts = () => {
        shopify.modal.show(REMOVE_ALL_MODAL_ID);
    };
    const confirmRemoveAllProducts = () => {
        setSelectedProducts([]);
        setGeneratedProducts([]);
        setPreviewPage(1);
        shopify.modal.hide(REMOVE_ALL_MODAL_ID);
    };

    const handlePrint = () => {
        if (!templateDesign) {
            shopify.toast.show("Please select a template.");
            return;
        }

        if (!selectedProducts.length) {
            shopify.toast.show("Please select at least one product.");
            return;
        }

        const bodyHtml = selectedProducts
            .map((product) => {
                const printLabel = document.getElementById(
                    `print-label-${product.variant_id}`
                );

                if (!printLabel) {
                    console.warn(
                        `Print label not found for variant ${product.variant_id}`
                    );
                    return "";
                }

                const qty = Math.max(
                    1,
                    Number(product.quantity) || 1
                );

                const labelHtml = printLabel.innerHTML;

                return Array.from({ length: qty }, () => `
                <div class="label">
                    <div class="label-content">
                        ${labelHtml}
                    </div>
                </div>
            `).join("");
            })
            .join("");

        if (!bodyHtml.trim()) {
            shopify.toast.show("No labels available to print.");
            return;
        }

        openPrintWindow({
            bodyHtml,
            paperTemplate: templateDesign.layout_settings,
            useJsBarcodeScript: true,
            onAfterPrint: savePrintHistory,
        });
    };

    const getSymbolValue = (product) => {
        switch (templateDesign.symbol_field_source) {
            case "barcode_value":
                return product.barcode || "";
            case "sku_value":
                return product.current_sku || "";
            case "product_name":
                return product.product_title || "";
            case "product_price":
                return String(product.price || "");
            case "product_vendor":
                return product.vendor || "";
            case "product_online_url":
                return product.online_url || "";
            default:
                return product.barcode || "";
        }
    };

    const totalSummaryPages = Math.max(1, Math.ceil(generatedProducts.length / SUMMARY_PAGE_SIZE));
    const summaryStart = (summaryPage - 1) * SUMMARY_PAGE_SIZE;
    const summaryEnd = summaryStart + SUMMARY_PAGE_SIZE;
    const paginatedSummary = generatedProducts.slice(summaryStart, summaryEnd);
    const totalPreviewPages = Math.max(1, Math.ceil(selectedProducts.length / PREVIEW_PAGE_SIZE));
    const previewStart = (previewPage - 1) * PREVIEW_PAGE_SIZE;
    const previewEnd = previewStart + PREVIEW_PAGE_SIZE;
    const formatProductPrice = (product) => {
        const decimals = Number(
            printSettings?.price_decimal_number ?? 2
        );
        let originalPrice = Number(product?.price ?? 0);
        if (originalPrice > 999) {
            originalPrice = originalPrice / 100;
        }
        const vatPercentage = Number(
            printSettings?.vat_percentage ?? 0
        );
        const priceWithVat =
            originalPrice +
            (originalPrice * vatPercentage) / 100;

        const amount = priceWithVat.toFixed(decimals);

        let format =
            templateDesign?.line2_currency_format || "{amount}";

        // Normalize old currency formats
        format = format
            .replace(/\{\{amount\}\}/gi, "{amount}")
            .replace(/\$amount/gi, "${amount}");

        return format.replace(/\{amount\}/gi, amount);
    };
    return (
        <>
            <s-page heading="Generate Barcode" subheading="Manage and edit your customized Barcode">
                <s-section>
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                        }}
                    >
                        <s-button
                            variant="primary"
                            onClick={() => navigate("/LabelHistory")}
                        >
                            Go to Label History
                        </s-button>

                        <s-button
                            variant="primary"
                            onClick={() => navigate("/TamplateCreate")}
                        >
                            Create Template
                        </s-button>
                    </div>
                </s-section>

                {error && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setError("")}>
                            {error}
                        </s-banner>
                    </s-section>
                )}

                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-heading>Barcode Generation Method</s-heading>

                        <s-choice-list
                            name="method"
                            label="Barcode generation method"
                            labelAccessibilityVisibility="exclusive"
                            onChange={(event) => {
                                const selected = event.currentTarget.values?.[0];
                                if (selected) setMethod(selected);
                            }}
                        >
                            <s-choice value="missing" selected={method === "missing"}>
                                Only generate barcode for selected products or variants that don't have barcode value yet
                            </s-choice>
                            <s-choice value="replace" selected={method === "replace"}>
                                Generate barcode for all selected products or variants. If products or variants don't have barcode value, generate new barcode data. If products or variants already have barcode value, replace the old value with new one
                            </s-choice>
                            <s-choice value="sku" selected={method === "sku"}>
                                Generate barcode from SKU
                            </s-choice>
                            <s-choice value="print" selected={method === "print"}>
                                Only Print Labels for selected products or variants already have barcode
                            </s-choice>
                        </s-choice-list>

                        {method === "replace" && (
                            <s-banner tone="warning">
                                <strong>Warning</strong>
                                <br />
                                Be careful with this option, your old barcode will be replaced, old printed labels will not be scanned. This option should be selected only when you want to change the barcode on your system
                            </s-banner>
                        )}

                        {method === "print" && (
                            <s-box maxInlineSize="350px">
                                <s-select
                                    label="Choose a template to print"
                                    value={selectedTemplate ? String(selectedTemplate) : ""}
                                    onChange={(event) => {
                                        const value = event.currentTarget.value;
                                        setSelectedTemplate(value);
                                        handleTemplateChange(value);
                                    }}
                                >
                                    <s-option value="">Select Template</s-option>
                                    {templates.map((template) => (
                                        <s-option key={template.id} value={String(template.id)}>
                                            {template.template_name}
                                        </s-option>
                                    ))}
                                </s-select>
                            </s-box>
                        )}

                        <s-divider />

                        <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                            <s-heading>Selected Products</s-heading>

                            {method === "missing" ? (
                                <s-text tone="subdued">
                                    All products without Barcode will be processed automatically.
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

                            <s-button
                                variant="primary"
                                loading={loading || undefined}
                                disabled={method === "print" || undefined}
                                onClick={generateBarcode}
                            >
                                Generate Barcode
                            </s-button>

                        </s-stack>
                        {loading && progress && progress.total > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <s-text>Generating barcodes</s-text>
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
                                <s-text color="subdued">
                                    {progress.processed} of {progress.total} products processed
                                    {progress.processed >= progress.total ? '' : '...'}
                                </s-text>
                            </div>
                        )}
                    </s-stack>
                </s-section>

                {generatedProducts.length > 0 && method !== "print" && (
                    <s-section>
                        <s-stack direction="block" gap="base">
                            <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                                <s-heading>Generated Barcode Summary</s-heading>
                                {generatedProducts.length > SUMMARY_PAGE_SIZE && (
                                    <s-text tone="subdued">
                                        Page {summaryPage} of {totalSummaryPages} ({generatedProducts.length} products)
                                    </s-text>
                                )}
                            </s-stack>

                            {paginatedSummary.map((item, index) => (
                                <s-box key={summaryStart + index} padding="base" borderWidth="base" borderRadius="base">
                                    <s-stack direction="block" gap="tight">
                                        <s-text fontWeight="bold">{item.product_title}</s-text>
                                        {item.variant_title !== "" && (
                                            <s-text tone="subdued">{item.variant_title}</s-text>
                                        )}
                                        <s-text>
                                            Old Barcode: <s-text fontWeight="bold">{item.old_barcode || "-"}</s-text>
                                        </s-text>
                                        <s-text tone="success">
                                            New Barcode: <s-text fontWeight="bold">{item.new_barcode}</s-text>
                                        </s-text>
                                    </s-stack>
                                </s-box>
                            ))}

                            {generatedProducts.length > SUMMARY_PAGE_SIZE && (
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
                        const productsWithQty = products.map(product => ({
                            ...product,
                            quantity:
                                selectedProducts.find(p => p.variant_id === product.variant_id)?.quantity ??
                                product.quantity ??
                                printSettings?.default_print_label_quantity ??
                                1,
                        }));

                        setSelectedProducts(productsWithQty);

                        setPreviewItem(prev => prev || productsWithQty[0] || null);
                        setPickerOpen(false);
                    }}
                />

                {method === "print" && templateDesign && selectedProducts.length > 0 && (
                    <s-section>
                        <s-stack direction="block" gap="base">
                            <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                                <s-heading>Preview</s-heading>
                                <s-stack
                                    direction="inline"
                                    gap="none"
                                    alignItems="center"
                                >
                                    <s-button
                                        icon="grid"
                                        variant={previewMode === "card" ? "secondary" : "tertiary"}
                                        accessibilityLabel="Card preview"
                                        onClick={() => setPreviewMode("card")}
                                    />

                                    <s-button
                                        icon="data-table"
                                        variant={previewMode === "table" ? "secondary" : "tertiary"}
                                        accessibilityLabel="Table preview"
                                        onClick={() => setPreviewMode("table")}
                                    />
                                </s-stack>
                                <s-stack direction="inline" gap="base" alignItems="center">
                                    <s-button tone="critical" variant="tertiary" onClick={requestRemoveAllProducts}>
                                        Delete All
                                    </s-button>
                                </s-stack>
                            </s-stack>
                            {previewMode === "card" && (
                                <div
                                    style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}
                                    ref={printRef}
                                    className="label"
                                >

                                    {selectedProducts.map((product, index) => (
                                        <div
                                            id={`label-${product.variant_id}`}
                                            key={product.variant_id}
                                            style={{
                                                display: index >= previewStart && index < previewEnd ? undefined : "none",
                                                width: "270px",
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                padding: "15px",
                                                background: "#fff",
                                            }}
                                        >
                                            <div
                                                className="no-print"
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    marginBottom: "12px",
                                                }}
                                            >
                                                <s-button
                                                    icon="delete"
                                                    variant="tertiary"
                                                    tone="critical"
                                                    accessibilityLabel="Remove product"
                                                    onClick={() => requestRemoveProduct(product.variant_id)}
                                                />
                                                <strong>{product.product_title}</strong>
                                                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                                    <s-button
                                                        variant="tertiary"
                                                        onClick={() =>
                                                            updateProductQuantity(product.variant_id, product.quantity - 1)
                                                        }
                                                    >
                                                        -
                                                    </s-button>
                                                    <div style={{ width: "auto" }}>
                                                        <s-text-field
                                                            label="Quantity"
                                                            labelAccessibilityVisibility="exclusive"
                                                            type="number"
                                                            min="1"
                                                            value={String(product.quantity ?? 1)}
                                                            onInput={(e) => {
                                                                const value = e.currentTarget.value;

                                                                if (value === "") {
                                                                    updateProductQuantity(product.variant_id, "");
                                                                    return;
                                                                }

                                                                const quantity = parseInt(value, 10);

                                                                if (!Number.isNaN(quantity) && quantity >= 1) {
                                                                    updateProductQuantity(
                                                                        product.variant_id,
                                                                        quantity
                                                                    );
                                                                }
                                                            }}
                                                        ></s-text-field>
                                                    </div>
                                                    <s-button
                                                        variant="tertiary"
                                                        onClick={() =>
                                                            updateProductQuantity(product.variant_id, product.quantity + 1)
                                                        }
                                                    >
                                                        +
                                                    </s-button>
                                                </div>
                                            </div>

                                            <div className="print-label">
                                                {templateDesign?.line1_sku && <div>{product.current_sku}</div>}
                                                {(() => {
                                                    const isValidOption = (value) => {
                                                        if (!value) return false;

                                                        const normalized = String(value).trim().toLowerCase();

                                                        return (
                                                            normalized !== "" &&
                                                            normalized !== "default title"
                                                        );
                                                    };

                                                    const options = [
                                                        templateDesign?.line2_variant_option1 && product.option_1,
                                                        templateDesign?.line2_variant_option2 && product.option_2,
                                                        templateDesign?.line2_variant_option3 && product.option_3,
                                                    ].filter(isValidOption);

                                                    const optionText = options.join(" / ");

                                                    const showName = Boolean(templateDesign?.line2_name);
                                                    const showPrice = Boolean(templateDesign?.line2_price);
                                                    const showOption = Boolean(optionText);

                                                    return (showName || showOption || showPrice) ? (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexWrap: "wrap",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: "4px",
                                                            }}
                                                        >
                                                            {showName && (
                                                                <span>
                                                                    {product.product_title}
                                                                </span>
                                                            )}

                                                            {showOption && (
                                                                <span>
                                                                    {optionText}
                                                                </span>
                                                            )}

                                                            {showPrice && (
                                                                <span>
                                                                    {formatProductPrice(product)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : null;
                                                })()}
                                                {templateDesign?.line3_vendor && product.vendor && (
                                                    <div>{product.vendor}</div>
                                                )}
                                                {templateDesign.symbol_type === "BARCODE" ? (
                                                    <BarcodeRenderer
                                                        value={getSymbolValue(product)}
                                                        settings={templateDesign}
                                                        barcodeSettings={templateDesign}
                                                    />
                                                ) : (
                                                    <QrCodeRenderer value={getSymbolValue(product)} settings={templateDesign} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {previewMode === "table" && (
                                <TablePreview
                                    products={selectedProducts.slice(previewStart, previewEnd)}
                                    templateDesign={templateDesign}
                                    getSymbolValue={getSymbolValue}
                                    formatProductPrice={formatProductPrice}
                                    onRemoveProduct={requestRemoveProduct}
                                    onUpdateQuantity={updateProductQuantity}
                                />
                            )}

                            {selectedProducts.length > PREVIEW_PAGE_SIZE && (
                                <s-stack direction="inline" gap="tight" alignItems="center">
                                    <s-button
                                        variant="tertiary"
                                        disabled={previewPage <= 1 || undefined}
                                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                                    >
                                        Previous
                                    </s-button>
                                    <s-button
                                        variant="tertiary"
                                        disabled={previewPage >= totalPreviewPages || undefined}
                                        onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                                    >
                                        Next
                                    </s-button>
                                </s-stack>
                            )}

                            <s-stack direction="inline" justifyContent="end">
                                <s-button variant="primary" onClick={handlePrint}>
                                    Print Label
                                </s-button>
                            </s-stack>
                        </s-stack>
                    </s-section>

                )}
                <div
                    ref={printContainerRef}
                    style={{
                        position: "absolute",
                        left: "-100000px",
                        top: 0,
                        width: "1px",
                        height: "1px",
                        overflow: "hidden",
                    }}
                >
                    {templateDesign && selectedProducts.map((product) => (
                        <div
                            key={`print-${product.variant_id}`}
                            id={`print-label-${product.variant_id}`}
                            className="print-template-label"
                        >
                            <TemplateLabelRenderer
                                design={templateDesign}
                                product={product}
                                barcodeSettings={templateDesign}
                                formatPrice={formatProductPrice}
                                printMode={true}
                            />
                        </div>
                    ))}
                </div>
            </s-page>

            <Modal id={REMOVE_PRODUCT_MODAL_ID}>
                <p style={{ padding: '1rem' }}>
                    Are you sure you want to remove this product from the preview? You'll need to add it again from "Choose Products" if you change your mind.
                </p>
                <TitleBar title="Remove product">
                    <button variant="primary" tone="critical" onClick={confirmRemoveProduct}>
                        Remove
                    </button>
                    <button onClick={() => shopify.modal.hide(REMOVE_PRODUCT_MODAL_ID)}>
                        Cancel
                    </button>
                </TitleBar>
            </Modal>
            <Modal id={REMOVE_ALL_MODAL_ID}>
                <p style={{ padding: '1rem' }}>
                    Are you sure you want to remove all {selectedProducts.length} products from the preview? You'll need to choose products again from "Choose Products" if you change your mind.
                </p>
                <TitleBar title="Delete all products">
                    <button variant="primary" tone="critical" onClick={confirmRemoveAllProducts}>
                        Delete All
                    </button>
                    <button onClick={() => shopify.modal.hide(REMOVE_ALL_MODAL_ID)}>
                        Cancel
                    </button>
                </TitleBar>
            </Modal>
        </>
    );
}
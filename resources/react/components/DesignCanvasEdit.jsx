import React, { useEffect, useState, useRef } from "react";
import LineControls from "../components/LineControls";
import SymbolControls from "../components/SymbolControls";
import BarcodeRenderer from "../components/BarcodeRenderer";
import QrCodeRenderer from "../components/QrCodeRenderer";
import PaperModelPreview from "./PaperModelPreview";
import { openPrintWindow } from "./Printlayout";

const defaultDesign = {
    line1_sku: true,
    line2_name: true,
    line2_price: false,
    line2_variant_option1: false,
    line3_vendor: false,
    symbol_enabled: true,
    symbol_type: "BARCODE",
    symbol_color: "#000000",
    symbol_field_source: "barcode_value",
    print_qty: 1,
};

export default function DesignCanvasEdit({
    templateId,
    onChange,
    onDirty,
    discardSignal,
    brand,
    model,
    paperTemplate,
    topFormFields,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activePreviewTab, setActivePreviewTab] = useState('label'); // 'label' | 'paper'
    const [design, setDesign] = useState(defaultDesign);
    const [previewItem, setPreviewItem] = useState({
        title: "Sample Item",
        sku: "SKU-1001",
        price: "10.00",
        vendor: "Vendor",
        option_1: "",
        online_url: "",
        currency_code: "USD",
    });

    const printRef = useRef(null);
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const [printSettings, setPrintSettings] = useState({});
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const [currencyCode, setCurrencyCode] = useState('USD');
    const initialLoadCompleted = useRef(false);

    useEffect(() => {
        loadDesign();
    }, [templateId, discardSignal]);

    async function loadDesign() {
        try {
            setLoading(true);
            const [templateRes, productRes, settingRes, barcodeRes] = await Promise.all([
                fetch(`/api/templates/design/${templateId}`),
                fetch(`/api/products`),
                fetch(`/api/print-settings`),
                fetch(`/api/barcode-settings`),
            ]);

            const template = await templateRes.json();
            const products = await productRes.json();
            const settings = await settingRes.json();
            const barcode = await barcodeRes.json();
            const storeCurrency = products.currency_code || 'USD';
            setCurrencyCode(storeCurrency);

            if (barcode.success) {
                setBarcodeSettings(
                    barcode.settings || barcode.data || barcode
                );
            }

            let defaultQty = 1;
            if (settings.success) {
                setPrintSettings(settings.settings);
                defaultQty =
                    settings.settings.default_print_label_quantity || 1;
            }

            if (template.success) {
                const loadedDesign = {
                    ...defaultDesign,
                    ...(barcode.settings || barcode.data || {}),
                    ...template.data,
                    print_qty:
                        template.data?.print_qty ?? defaultQty,
                };
                if (loadedDesign.line2_currency_format) {
                    const cleaned = loadedDesign.line2_currency_format
                        .replace(/\{\{amount\}\}/gi, "{amount}")
                        .replace(/\$amount/gi, "${amount}")
                        .trim();
                    loadedDesign.line2_currency_format =
                        cleaned === "${amount}" || cleaned === "{amount}" ? "" : cleaned;
                }
                if (!loadedDesign.line2_currency_format || loadedDesign.line2_currency_format.trim() === '') {
                    loadedDesign.line2_currency_format = settings?.settings?.currency_format ?? 'without_currency';
                }

                setDesign(loadedDesign);
                initialLoadCompleted.current = true;
                onChange?.(loadedDesign, true);
            }

            if (products.status === 1 && products.variants?.length) {
                setStoreVariants(products.variants);

                const savedVariantId = template.data?.selected_variant_id || "";

                const selected =
                    products.variants.find(
                        (item) => item.variant_id === savedVariantId
                    ) || products.variants[0];

                setSelectedVariantId(selected.variant_id);
                setPreviewItem({
                    title: selected.product_title,
                    sku: selected.current_sku || "NO SKU",
                    barcode: selected.barcode || "",
                    price: selected.price,
                    vendor: selected.vendor,
                    option_1:
                        selected.variant_title !== "Default Title"
                            ? selected.variant_title
                            : "",
                    online_url: selected.online_url || "",
                    currency_code: selected.currency_code || storeCurrency,
                });
            }
        } catch (err) {
            console.error(err);
            setError("Unable to load design.");
        } finally {
            setLoading(false);
        }
    }

    function updateField(key, value) {
        setDesign((prev) => {
            if (prev[key] === value) {
                return prev;
            }
            const updated = {
                ...prev,
                [key]: value,
            };
            if (initialLoadCompleted.current) {
                onChange?.(updated);
                onDirty?.();
            }
            return updated;
        });
    }

    const handlePrint = () => {
        if (!printRef.current) {
            shopify.toast.show(
                "Print preview not ready. Please try again.",
                { duration: 5000, isError: true }
            );
            return;
        }

        const qty = Math.max(1, Number(design.print_qty) || 1);
        let paper = paperTemplate || design.layout_settings || design.paper_template;

        if (!paper || !paper.label || !paper.label.width || !paper.label.height) {
            shopify.toast.show(
                "Please select a valid paper model before printing.",
                { duration: 5000, isError: true }
            );
            return;
        }

        let labelHtml = printRef.current.innerHTML;
        labelHtml = `<div class="label-content">${labelHtml}</div>`;

        const rows = Number(paper.rows || 1);
        const columns = Number(paper.columns || 1);
        const labelsPerSheet = rows * columns;
        let sheets = [];

        if (paper.type === "roll" || labelsPerSheet === 1) {
            for (let i = 0; i < qty; i++) {
                sheets.push(`<div class="print-sheet"><div class="label">${labelHtml}</div></div>`);
            }
        } else {
            const totalSheets = Math.ceil(qty / labelsPerSheet);
            let labelsLeft = qty;

            for (let s = 0; s < totalSheets; s++) {
                const countOnThisSheet = Math.min(labelsLeft, labelsPerSheet);
                let sheetHtml = `<div class="print-sheet">`;
                for (let c = 0; c < countOnThisSheet; c++) {
                    sheetHtml += `<div class="label">${labelHtml}</div>`;
                }
                sheetHtml += `</div>`;
                sheets.push(sheetHtml);
                labelsLeft -= countOnThisSheet;
            }
        }

        const success = openPrintWindow({
            paperTemplate: paper,
            paperSettings: paper,
            bodyHtml: sheets.join(""),
            sheetsHtml: sheets.join(""),
            printSettings,
        });

        if (!success) {
            shopify.toast.show(
                "Failed to open print window. Please allow popups.",
                { duration: 5000, isError: true }
            );
        }
    };

    function handleVariantChange(e) {
        const variantId = e.currentTarget.value;
        setSelectedVariantId(variantId);

        const selected = storeVariants.find(
            (item) => String(item.variant_id) === String(variantId)
        );

        if (selected) {
            setPreviewItem({
                title: selected.product_title,
                sku: selected.current_sku || "NO SKU",
                barcode: selected.barcode || "",
                price: selected.price,
                vendor: selected.vendor,
                option_1:
                    selected.variant_title !== "Default Title"
                        ? selected.variant_title
                        : "",
                online_url: selected.online_url || "",
                currency_code: selected.currency_code || currencyCode,
            });
            onDirty?.();
        }
    }

    function formatPrice(val) {
        const num = Number(val);
        const decimals = Number(printSettings?.price_decimal_number ?? 2);
        const formatted = isNaN(num) ? val : num.toFixed(decimals);

        const activeFormat = design.line2_currency_format || printSettings?.currency_format || 'without_currency';
        const code = previewItem.currency_code || currencyCode || 'USD';
        const locale = code === 'INR' ? 'en-IN' : 'en-US';

        if (activeFormat === 'currency_code') {
            return `${formatted} ${code}`;
        }

        if (activeFormat === 'with_currency') {
            try {
                return new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: code,
                    currencyDisplay: 'symbol',
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(isNaN(num) ? 0 : num);
            } catch (e) {
                return `$${formatted}`;
            }
        }

        return formatted;
    }

    const getSymbolTargetValue = () => {
        const fieldSource = design.symbol_field_source || "barcode_value";
        switch (fieldSource) {
            case "product_name":
            case "title":
            case "name":
                return previewItem.title || "Dumplings";

            case "product_price":
            case "price":
                return formatPrice ? formatPrice(previewItem.price) : (previewItem.price || "190.30");

            case "product_online_url":
            case "product_page_url":
            case "online_url":
            case "url":
                return previewItem.online_url || "https://store.myshopify.com/products/dumplings";

            case "sku_value":
            case "product_sku":
            case "sku":
                return previewItem.sku || "SKU-DUMPLINGS";

            case "barcode_value":
            case "barcode":
            default:
                return previewItem.barcode || previewItem.sku || "62096153723";
        }
    };

    if (loading) {
        return (
            <s-box padding="base" alignContent="center">
                <s-spinner accessibilityLabel="Loading designer" size="large" />
            </s-box>
        );
    }

    const paperDimensionsText = paperTemplate?.label
        ? `${paperTemplate.label.width} × ${paperTemplate.label.height} mm`
        : 'Auto';

    return (
        <s-box paddingBlockStart="base">
            {error && <s-banner tone="critical">{error}</s-banner>}

            <div style={{ display: "grid", gridTemplateColumns: "58% 40%", gap: "24px" }}>
                {/* LEFT CONFIGURATION COLUMN */}
                <s-stack direction="block" gap="base">
                    {topFormFields}

                    <s-select
                        label="Preview Product Variant"
                        value={selectedVariantId}
                        onChange={handleVariantChange}
                    >
                        {storeVariants.map((item) => (
                            <s-option key={item.variant_id} value={item.variant_id}>
                                {`${item.product_title} (${item.barcode || 'No Barcode'})`}
                            </s-option>
                        ))}
                    </s-select>

                    <LineControls
                        design={design}
                        handleUpdate={updateField}
                    />

                    <SymbolControls
                        design={design}
                        handleUpdate={updateField}
                        barcodeSettings={barcodeSettings}
                    />
                </s-stack>

                {/* RIGHT STICKY PREVIEW COLUMN WITH TAB SWITCHER */}
                <div
                    style={{
                        position: "sticky",
                        top: "20px",
                        alignSelf: "flex-start",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        width: "100%",
                    }}
                >
                    {/* TAB CONTROL SWITCHER */}
                    <div style={{ display: 'flex', gap: '6px', background: '#eef1f5', padding: '5px', borderRadius: '10px' }}>
                        <button
                            type="button"
                            onClick={() => setActivePreviewTab('label')}
                            style={{
                                flex: 1,
                                padding: '9px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: '7px',
                                border: 'none',
                                cursor: 'pointer',
                                background: activePreviewTab === 'label' ? '#ffffff' : 'transparent',
                                color: activePreviewTab === 'label' ? '#008ba8' : '#5c5f62',
                                boxShadow: activePreviewTab === 'label' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 4.5A.5.5 0 0 1 2.5 4h1a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-11zm4 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-11zm5 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-11zm4 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-11z" />
                            </svg>
                            <span>Barcode Label Preview</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActivePreviewTab('paper')}
                            style={{
                                flex: 1,
                                padding: '9px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: '7px',
                                border: 'none',
                                cursor: 'pointer',
                                background: activePreviewTab === 'paper' ? '#ffffff' : 'transparent',
                                color: activePreviewTab === 'paper' ? '#008ba8' : '#5c5f62',
                                boxShadow: activePreviewTab === 'paper' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V3zm7 0v3.5a.5.5 0 0 0 .5.5H15l-4-4zm-4 7.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5zm0 3a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" clipRule="evenodd" />
                            </svg>
                            <span>Paper Layout Preview</span>
                        </button>
                    </div>

                    {/* CONDITIONAL PREVIEW CONTENT */}
                    {activePreviewTab === 'label' ? (
                        /* LIVE BARCODE LABEL PREVIEW */
                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e1e3e5",
                                borderRadius: "8px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                padding: "16px",
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            {/* PREVIEW HEADER */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #f1f2f3", paddingBottom: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#008ba8" }} />
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a" }}>
                                        Live Label Preview
                                    </span>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "12px", background: "#e0f7fa", color: "#007a99" }}>
                                    {paperDimensionsText}
                                </span>
                            </div>

                            {/* PHYSICAL WHITE LABEL PREVIEW CONTAINER */}
                            <div style={{ background: "#f6f6f7", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "190px" }}>
                                <div
                                    ref={printRef}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #d2d5d8",
                                        borderRadius: "6px",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                                        padding: "14px 16px",
                                        width: "100%",
                                        maxWidth: "320px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textAlign: "center",
                                        boxSizing: "border-box",
                                        overflow: "hidden",
                                    }}
                                >
                                    {design.line1_sku && (
                                        <div className="print-sku" style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal', maxWidth: '100%', lineHeight: 1.25, padding: '0 4px', textAlign: 'center', color: '#1a1a1a' }}>
                                            {previewItem.sku}
                                        </div>
                                    )}

                                    <div className="print-line2" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 5, maxWidth: '100%', wordBreak: 'break-word' }}>
                                        {design.line2_name && <span className="print-title" style={{ fontWeight: 700, color: '#202223' }}>{previewItem.title}</span>}
                                        {design.line2_variant_option1 && previewItem.option_1 && <span className="print-variant" style={{ color: '#666' }}>• {previewItem.option_1}</span>}
                                        {design.line2_price && <span className="print-price" style={{ color: '#000', fontWeight: 700 }}>{formatPrice(previewItem.price)}</span>}
                                    </div>

                                    {design.line3_vendor && <div className="print-vendor" style={{ fontWeight: 500, color: '#666', marginBottom: 5 }}>{previewItem.vendor}</div>}

                                    {design.symbol_enabled && (
                                        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', overflow: 'hidden', marginTop: '4px' }}>
                                            {design.symbol_type === "BARCODE" ? (
                                                <BarcodeRenderer
                                                    value={getSymbolTargetValue()}
                                                    settings={design}
                                                    barcodeSettings={{
                                                        ...barcodeSettings,
                                                        barcode_format:
                                                            design.barcode_format ||
                                                            barcodeSettings.barcode_format,
                                                        ...design,
                                                    }}
                                                />
                                            ) : (
                                                <QrCodeRenderer
                                                    value={getSymbolTargetValue()}
                                                    settings={design}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* PAPER MODEL LAYOUT PREVIEW */
                        <PaperModelPreview brand={brand} model={model} paper={paperTemplate} />
                    )}

                    {/* PRINT TEST LABEL CARD - ONLY SHOW WHEN BARCODE LABEL PREVIEW TAB IS ACTIVE */}
                    {activePreviewTab === 'label' && (
                        <s-box padding="base" borderWidth="base" borderRadius="base" style={{ background: "#ffffff" }}>
                            <s-stack direction="block" gap="base">
                                <s-text-field
                                    label="Print Quantity"
                                    type="number"
                                    value={String(design.print_qty || 1)}
                                    onInput={(event) =>
                                        updateField(
                                            "print_qty",
                                            Math.max(
                                                1,
                                                parseInt(event.currentTarget.value) || 1
                                            )
                                        )
                                    }
                                />
                                <s-button variant="primary" onClick={handlePrint}>
                                    Print Test Label
                                </s-button>
                            </s-stack>
                        </s-box>
                    )}
                </div>
            </div>
        </s-box>
    );
}
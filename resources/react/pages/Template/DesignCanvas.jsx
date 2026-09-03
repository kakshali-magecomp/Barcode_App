import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppBridge, TitleBar } from '@shopify/app-bridge-react';
import { useParams, useNavigate } from 'react-router-dom';
import LineControls from '../../components/LineControls';
import SymbolControls from '../../components/SymbolControls';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import QrCodeRenderer from '../../components/QrCodeRenderer';
import PaperModelPreview from '../../components/PaperModelPreview';
import { PAPER_TEMPLATES } from '../../components/PaperTemplateSettings';
import { openPrintWindow } from '../../components/Printlayout';

const SAVE_BAR_ID = 'design-canvas-savebar';

export default function DesignCanvas() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const { id } = useParams();
    const printRef = useRef(null);

    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const [activePreviewTab, setActivePreviewTab] = useState('label'); // 'label' | 'paper'

    const [design, setDesign] = useState({
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
    });

    const [originalDesign, setOriginalDesign] = useState(null);
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const [originalVariantId, setOriginalVariantId] = useState("");
    const [previewItem, setPreviewItem] = useState({
        title: 'Sample Item',
        sku: 'SKU-1001',
        barcode: '123456789012',
        price: '10.00',
        vendor: 'Vendor',
        option_1: '',
        currency_code: 'USD',
    });

    const [printSettings, setPrintSettings] = useState({});
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [errorBanner, setErrorBanner] = useState(null);

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

    useEffect(() => {
        async function loadData() {
            try {
                setPageLoading(true);
                const [tRes, pRes, sRes, bRes] = await Promise.all([
                    fetch(`/api/templates/design/${id}`),
                    fetch('/api/products'),
                    fetch('/api/print-settings'),
                    fetch('/api/barcode-settings'),
                ]);

                let globalBarcodeFormat = "CODE128";
                let defaultPrintQty = 1;
                let storeCurrency = "USD";

                if (bRes.ok) {
                    const barcode = await bRes.json();
                    setBarcodeSettings(barcode.settings || barcode.data || barcode);
                    globalBarcodeFormat =
                        barcode?.settings?.barcode_format ||
                        barcode?.data?.barcode_format ||
                        barcode?.barcode_format ||
                        "CODE128";
                }

                if (sRes.ok) {
                    const settings = await sRes.json();
                    if (settings.success) {
                        setPrintSettings(settings.settings);
                        defaultPrintQty = settings.settings.default_print_label_quantity || 1;
                    }
                }

                let savedVariantId = "";

                if (tRes.ok) {
                    const r = await tRes.json();
                    if (r.success) {
                        savedVariantId = r.data.selected_variant_id || "";

                        const designData = {
                            ...r.data,
                            barcode_format:
                                r.data.barcode_format || globalBarcodeFormat,
                            print_qty:
                                r.data.print_qty || defaultPrintQty,
                        };

                        setDesign(designData);
                        setOriginalDesign(structuredClone(designData));
                        setOriginalVariantId(savedVariantId);
                    }
                }

                if (pRes.ok) {
                    const r = await pRes.json();
                    storeCurrency = r.currency_code || 'USD';
                    setCurrencyCode(storeCurrency);

                    if (r.status === 1 && r.variants?.length > 0) {
                        setStoreVariants(r.variants);
                        const selected =
                            r.variants.find(item => item.variant_id === savedVariantId) || r.variants[0];

                        setSelectedVariantId(selected.variant_id);
                        setPreviewItem({
                            title: selected.product_title,
                            sku: selected.current_sku || "NO-SKU",
                            barcode: selected.barcode || "",
                            price: selected.price,
                            vendor: selected.vendor,
                            option_1:
                                selected.variant_title !== "Default Title"
                                    ? selected.variant_title
                                    : "",
                            currency_code: selected.currency_code || storeCurrency,
                        });
                    }
                }
            } catch {
                setErrorBanner("Failed to communicate with template design configurations.");
            } finally {
                setPageLoading(false);
                setIsDirty(false);
            }
        }
        loadData();
    }, [id]);

    const handleUpdate = (key, value) => {
        setIsDirty(true);
        setDesign(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = useCallback(async () => {
        setLoading(true);
        setErrorBanner(null);
        try {
            const res = await fetch(`/api/templates/design/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...design,
                    barcode_format: design.barcode_format,
                    selected_variant_id: selectedVariantId,
                })
            });

            const result = await res.json();
            if (result.success) {
                shopify.toast.show("Template parameters saved to store!");
                setIsDirty(false);
                setTimeout(() => {
                    navigate("/TemplateList");
                }, 1000);
            } else {
                setErrorBanner(result.message);
            }
        } catch {
            setErrorBanner("Could not sync layout profiles to database table parameters.");
        } finally {
            setLoading(false);
        }
    }, [id, design, selectedVariantId, navigate, shopify]);

    const handleDiscard = useCallback(() => {
        if (originalDesign) {
            setDesign(structuredClone(originalDesign));
        }
        if (originalVariantId) {
            setSelectedVariantId(originalVariantId);
            const selected = storeVariants.find(item => item.variant_id === originalVariantId);
            if (selected) {
                setPreviewItem({
                    title: selected.product_title,
                    sku: selected.current_sku || "NO-SKU",
                    barcode: selected.barcode || "",
                    price: selected.price,
                    vendor: selected.vendor,
                    option_1: selected.variant_title !== "Default Title" ? selected.variant_title : "",
                    currency_code: selected.currency_code || currencyCode,
                });
            }
        }
        setIsDirty(false);
        setErrorBanner(null);
        shopify.saveBar.hide(SAVE_BAR_ID);
    }, [originalDesign, originalVariantId, storeVariants, currencyCode, shopify]);

    const handlePrint = () => {
        if (!printRef.current) return;

        const qty = Math.max(1, Number(design.print_qty) || 1);
        const paperBrand = design.paper_brand;
        const paperModel = design.paper_model;
        const paper = PAPER_TEMPLATES?.[paperBrand]?.[paperModel] || design.layout_settings;

        if (!paper || !paper.label || !paper.label.width || !paper.label.height) {
            shopify.toast.show("Please select a valid paper model before printing.", { duration: 5000, isError: true });
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
            shopify.toast.show("Failed to open print window. Please allow popups.", { duration: 5000, isError: true });
        }
    };

    const handleVariantChange = (event) => {
        const val = event.currentTarget.value;
        setSelectedVariantId(val);
        setIsDirty(true);
        const selected = storeVariants.find(item => item.variant_id === val);
        if (selected) {
            setPreviewItem({
                title: selected.product_title,
                sku: selected.current_sku || "NO-SKU",
                barcode: selected.barcode || "",
                price: selected.price,
                vendor: selected.vendor,
                option_1: selected.variant_title !== "Default Title" ? selected.variant_title : "",
                currency_code: selected.currency_code || currencyCode,
            });
        }
    };

    const formatPreviewPrice = () => {
        const rawPrice = previewItem.price ?? '0.00';
        const decimals = Number(printSettings?.price_decimal_number ?? 2);
        const numPrice = Number(rawPrice);
        const formattedNum = isNaN(numPrice) ? rawPrice : numPrice.toFixed(decimals);

        const activeFormat = design.line2_currency_format || printSettings?.currency_format || 'without_currency';
        const code = previewItem.currency_code || currencyCode || 'USD';
        const locale = code === 'INR' ? 'en-IN' : 'en-US';

        if (activeFormat === 'currency_code') {
            return `${formattedNum} ${code}`;
        }

        if (activeFormat === 'with_currency') {
            try {
                return new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: code,
                    currencyDisplay: 'symbol',
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(isNaN(numPrice) ? 0 : numPrice);
            } catch (e) {
                return `$${formattedNum}`;
            }
        }

        return formattedNum;
    };

    const getSymbolTargetValue = () => {
        const fieldSource = design.symbol_field_source || "barcode_value";
        switch (fieldSource) {
            case "product_name":
            case "title":
            case "name":
                return previewItem.title || "Dumplings";

            case "product_price":
            case "price":
                return formatPreviewPrice ? formatPreviewPrice() : (previewItem.price || "190.30");

            case "product_online_url":
            case "product_page_url":
            case "online_url":
            case "url": {
                const params = new URLSearchParams(window.location.search);
                const shopDomain = params.get('shop') || window.shopify?.config?.shop || 'kakshalijani.myshopify.com';
                let rawUrl = previewItem.online_url || "";
                if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && !rawUrl.includes("store.myshopify.com")) {
                    return rawUrl.trim();
                }
                const handle = (previewItem.title || "product").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                return `https://${shopDomain}/products/${handle}`.trim();
            }

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

    const paperTemplate = PAPER_TEMPLATES?.[design.paper_brand]?.[design.paper_model] || design.layout_settings;

    if (pageLoading) {
        return (
            <s-page heading="Design Barcode Template">
                <TitleBar title="barcodedemo-app" />
                <s-box padding="base" alignContent="center">
                    <s-spinner accessibilityLabel="Loading designer" size="large" />
                </s-box>
            </s-page>
        );
    }

    const paperDimensionsText = paperTemplate?.label
        ? `${paperTemplate.label.width} × ${paperTemplate.label.height} mm`
        : 'Auto';

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button type="button" variant="primary" disabled={loading} onClick={handleSave}>
                    {loading ? 'Saving…' : 'Save parameters'}
                </button>
                <button type="button" disabled={loading} onClick={handleDiscard}>
                    Discard
                </button>
            </ui-save-bar>

            <s-page heading="Design Barcode Template">
                <TitleBar title="barcodedemo-app" />
                <s-box paddingBlockStart="base">
                    <s-stack direction="inline" gap="small" alignItems="center">
                        <s-link href="/TemplateList" tone="neutral">
                            <s-icon type="arrow-left" />
                        </s-link>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: '#000' }}>Back to Template List</span>
                    </s-stack>
                </s-box>

                <s-box paddingBlockStart="base" />

                <s-section>
                    {errorBanner && (
                        <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            {errorBanner}
                        </s-banner>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '58% 40%', gap: '24px' }}>
                        {/* LEFT CONFIGURATION COLUMN */}
                        <s-stack direction="block" gap="base">
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

                            <LineControls design={design} handleUpdate={handleUpdate} />

                            <SymbolControls design={design} handleUpdate={handleUpdate} barcodeSettings={barcodeSettings} />
                        </s-stack>

                        {/* RIGHT STICKY PREVIEW COLUMN WITH TAB SWITCHER */}
                        <div
                            style={{
                                position: 'sticky',
                                top: '20px',
                                alignSelf: 'flex-start',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                width: '100%',
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
                                        background: '#ffffff',
                                        border: '1px solid #e1e3e5',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        padding: '16px',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {/* PREVIEW HEADER */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f2f3', paddingBottom: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#008ba8' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>
                                                Live Label Preview
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '12px', background: '#e0f7fa', color: '#007a99' }}>
                                            {paperDimensionsText}
                                        </span>
                                    </div>

                                    {/* PHYSICAL WHITE LABEL PREVIEW CONTAINER */}
                                    <div style={{ background: '#f6f6f7', borderRadius: '10px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '190px' }}>
                                        <div
                                            ref={printRef}
                                            style={{
                                                background: '#ffffff',
                                                border: '1px solid #d2d5d8',
                                                borderRadius: '6px',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                                padding: '14px 16px',
                                                width: '100%',
                                                maxWidth: '320px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                textAlign: 'center',
                                                boxSizing: 'border-box',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {design.line1_sku && (
                                                <div className="print-sku" style={{ fontWeight: 700, margin: 0, fontSize: 13, wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal', maxWidth: '100%', lineHeight: 1.25, padding: '0 4px', textAlign: 'center', color: '#1a1a1a' }}>
                                                    {previewItem.sku}
                                                </div>
                                            )}

                                            <div className="print-line2" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, margin: 0, maxWidth: '100%', wordBreak: 'break-word' }}>
                                                {design.line2_name && <span className="print-title" style={{ fontWeight: 700, color: '#202223' }}>{previewItem.title}</span>}
                                                {design.line2_variant_option1 && previewItem.option_1 && <span className="print-variant" style={{ color: '#666' }}>• {previewItem.option_1}</span>}
                                                {design.line2_price && <span className="print-price" style={{ color: '#000', fontWeight: 700 }}>{formatPreviewPrice()}</span>}
                                            </div>

                                            {design.line3_vendor && <div className="print-vendor" style={{ fontWeight: 500, color: '#666', margin: 0 }}>{previewItem.vendor}</div>}

                                            {design.symbol_enabled && (
                                                <div className="label-symbol-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0, overflow: 'hidden' }}>
                                                    {design.symbol_type === "BARCODE" ? (
                                                        <BarcodeRenderer
                                                            value={getSymbolTargetValue()}
                                                            field={design.symbol_field_source}
                                                            settings={design}
                                                            barcodeSettings={{
                                                                ...(barcodeSettings.data ?? barcodeSettings),
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
                                <PaperModelPreview brand={design.paper_brand} model={design.paper_model} paper={paperTemplate} />
                            )}

                            {/* PRINT TEST LABEL CARD - ONLY SHOW WHEN BARCODE LABEL PREVIEW TAB IS ACTIVE */}
                            {activePreviewTab === 'label' && (
                                <s-box padding="base" borderWidth="base" borderRadius="base" style={{ background: '#ffffff' }}>
                                    <s-stack direction="block" gap="base">
                                        <s-text-field
                                            label="Print Quantity"
                                            type="number"
                                            value={String(design.print_qty || 1)}
                                            onInput={(event) =>
                                                handleUpdate(
                                                    "print_qty",
                                                    Math.max(1, parseInt(event.currentTarget.value) || 1)
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
                </s-section>
            </s-page>
        </>
    );
}
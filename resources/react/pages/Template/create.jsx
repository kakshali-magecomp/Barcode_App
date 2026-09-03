import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppBridge, TitleBar } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';
import PaperTemplateSettings, { PAPER_TEMPLATES, defaultCustomPaper } from '../../components/PaperTemplateSettings';
import LineControls from '../../components/LineControls';
import SymbolControls from '../../components/SymbolControls';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import QrCodeRenderer from '../../components/QrCodeRenderer';
import PaperModelPreview from '../../components/PaperModelPreview';
import { openPrintWindow } from '../../components/Printlayout';

const SAVE_BAR_ID = 'create-template-savebar';

const FieldLabel = ({ label, tooltip }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#303030' }}>{label}</span>
        {tooltip && (
            <span title={tooltip} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: '#616161' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            </span>
        )}
    </div>
);

export default function CreateTemplate() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const printRef = useRef(null);

    const initialStateRef = useRef(null);
    const isDiscardingRef = useRef(false);

    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const [activePreviewTab, setActivePreviewTab] = useState('label'); // 'label' | 'paper'

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');

    const [brand, setBrand] = useState('dymo');
    const [model, setModel] = useState('30252');
    const [customPaper, setCustomPaper] = useState(structuredClone(defaultCustomPaper));

    const [design, setDesign] = useState({
        line1_sku: true,
        line2_name: true,
        line2_price: false,
        line2_variant_option1: false,
        line3_vendor: false,
        symbol_enabled: true,
        symbol_type: 'BARCODE',
        symbol_color: '#000000',
        symbol_field_source: 'barcode_value',
        print_qty: 1,
    });

    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [previewItem, setPreviewItem] = useState({
        title: 'Sample Product',
        sku: 'SKU-1001',
        barcode: '123456789012',
        price: '19.99',
        vendor: 'Store Vendor',
        option_1: 'Medium',
        currency_code: 'USD',
    });

    const [printSettings, setPrintSettings] = useState({});
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const [currencyCode, setCurrencyCode] = useState('USD');

    const [errorBanner, setErrorBanner] = useState(null);
    const selectedPaperTemplate = useMemo(() => {
        if (brand === 'custom' || model === 'custom') {
            return customPaper;
        }
        return PAPER_TEMPLATES?.[brand]?.[model] || null;
    }, [brand, model, customPaper]);

    useEffect(() => {
        if (isDirty) {
            try { shopify?.saveBar?.show?.(SAVE_BAR_ID); } catch (e) { }
        } else {
            try { shopify?.saveBar?.hide?.(SAVE_BAR_ID); } catch (e) { }
        }
    }, [isDirty, shopify]);

    useEffect(() => {
        let isMounted = true;

        async function fetchInitialData() {
            try {
                setPageLoading(true);

                const [productRes, printSettingRes, barcodeSettingRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/print-settings'),
                    fetch('/api/barcode-settings'),
                ]);

                const products = await productRes.json().catch(() => ({ status: 0 }));
                const printData = await printSettingRes.json().catch(() => ({ success: false }));
                const barcodeData = await barcodeSettingRes.json().catch(() => ({ success: false }));

                if (!isMounted) return;

                const storeCurrency = products?.currency_code || 'USD';
                setCurrencyCode(storeCurrency);

                if (printData?.success) {
                    setPrintSettings(printData.settings || {});
                }

                if (barcodeData?.success) {
                    setBarcodeSettings(barcodeData.settings || barcodeData.data || {});
                }

                const defaultQty = printData?.settings?.default_print_label_quantity || 1;
                const defaultCurrencyFormat = printData?.settings?.currency_format || 'without_currency';

                setDesign((prev) => ({
                    ...prev,
                    print_qty: defaultQty,
                    line2_currency_format: defaultCurrencyFormat,
                    ...(barcodeData?.settings || barcodeData?.data || {}),
                }));

                if (products?.status === 1 && products?.variants?.length) {
                    setStoreVariants(products.variants);
                    const firstVariant = products.variants[0];
                    setSelectedVariantId(firstVariant.variant_id);
                    setPreviewItem({
                        title: firstVariant.product_title,
                        sku: firstVariant.current_sku || 'NO SKU',
                        barcode: firstVariant.barcode || '',
                        price: firstVariant.price,
                        vendor: firstVariant.vendor,
                        option_1: firstVariant.variant_title !== 'Default Title' ? firstVariant.variant_title : '',
                        currency_code: firstVariant.currency_code || storeCurrency,
                    });
                }

                initialStateRef.current = {
                    name: '',
                    description: '',
                    note: '',
                    brand: 'dymo',
                    model: '30252',
                    customPaper: structuredClone(defaultCustomPaper),
                    design: {
                        line1_sku: true,
                        line2_name: true,
                        line2_price: false,
                        line2_variant_option1: false,
                        line3_vendor: false,
                        symbol_enabled: true,
                        symbol_type: 'BARCODE',
                        symbol_color: '#000000',
                        symbol_field_source: 'barcode_value',
                        print_qty: defaultQty,
                        line2_currency_format: defaultCurrencyFormat,
                        ...(barcodeData?.settings || barcodeData?.data || {}),
                    },
                    selectedVariantId: products?.variants?.[0]?.variant_id || '',
                };

                setIsDirty(false);
            } catch (err) {
                console.error('Failed to load create template initial state:', err);
                setErrorBanner('Failed to load initial store data for template designer.');
            } finally {
                if (isMounted) {
                    setPageLoading(false);
                }
            }
        }

        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, []);

    const markDirty = useCallback(() => {
        if (!isDiscardingRef.current) {
            setIsDirty(true);
        }
    }, []);

    const handleFieldChange = (setter) => (e) => {
        setter(e.currentTarget.value);
        markDirty();
    };

    const handleDesignUpdate = (key, value) => {
        setDesign((prev) => {
            if (prev[key] === value) return prev;
            markDirty();
            return { ...prev, [key]: value };
        });
    };

    const handleVariantChange = (e) => {
        const variantId = e.currentTarget.value;
        setSelectedVariantId(variantId);
        markDirty();

        const selected = storeVariants.find((v) => String(v.variant_id) === String(variantId));
        if (selected) {
            setPreviewItem({
                title: selected.product_title,
                sku: selected.current_sku || 'NO SKU',
                barcode: selected.barcode || '',
                price: selected.price,
                vendor: selected.vendor,
                option_1: selected.variant_title !== 'Default Title' ? selected.variant_title : '',
                online_url: selected.online_url || selected.url || `https://${new URLSearchParams(window.location.search).get('shop') || window.shopify?.config?.shop || 'kakshalijani.myshopify.com'}/products/${selected.handle || 'product'}`,
                currency_code: selected.currency_code || currencyCode,
            });
        }
    };

    const handleDiscard = useCallback(() => {
        if (!initialStateRef.current) return;

        isDiscardingRef.current = true;
        const init = initialStateRef.current;

        setName(init.name);
        setDescription(init.description);
        setNote(init.note);
        setBrand(init.brand);
        setModel(init.model);
        setCustomPaper(structuredClone(init.customPaper));
        setDesign(structuredClone(init.design));
        setSelectedVariantId(init.selectedVariantId);

        const selected = storeVariants.find((v) => String(v.variant_id) === String(init.selectedVariantId));
        if (selected) {
            setPreviewItem({
                title: selected.product_title,
                sku: selected.current_sku || 'NO SKU',
                barcode: selected.barcode || '',
                price: selected.price,
                vendor: selected.vendor,
                option_1: selected.variant_title !== 'Default Title' ? selected.variant_title : '',
                online_url: selected.online_url || selected.url || `https://${new URLSearchParams(window.location.search).get('shop') || window.shopify?.config?.shop || 'kakshalijani.myshopify.com'}/products/${selected.handle || 'product'}`,
                currency_code: selected.currency_code || currencyCode,
            });
        }

        setIsDirty(false);
        setErrorBanner(null);

        try { shopify?.saveBar?.hide?.(SAVE_BAR_ID); } catch (e) { }

        setTimeout(() => {
            isDiscardingRef.current = false;
        }, 100);
    }, [storeVariants, currencyCode, shopify]);

    const formatPreviewPrice = useCallback(() => {
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
    }, [previewItem.price, previewItem.currency_code, printSettings, design.line2_currency_format, currencyCode]);

    const getSymbolTargetValue = useCallback(() => {
        const fieldSource = design.symbol_field_source || 'barcode_value';
        switch (fieldSource) {
            case 'product_name':
            case 'title':
            case 'name':
                return previewItem.title || 'Dumplings';

            case 'product_price':
            case 'price':
                return formatPreviewPrice ? formatPreviewPrice() : (previewItem.price || '190.30');

            case 'product_online_url':
            case 'product_page_url':
            case 'online_url':
            case 'url': {
                const shopDomain = new URLSearchParams(window.location.search).get('shop') || window.shopify?.config?.shop || 'kakshalijani.myshopify.com';
                let rawUrl = previewItem.online_url || '';
                if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) && !rawUrl.includes('store.myshopify.com')) {
                    return rawUrl.trim();
                }
                const handle = (previewItem.title || 'product').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                return `https://${shopDomain}/products/${handle}`.trim();
            }

            case 'sku_value':
            case 'product_sku':
            case 'sku':
                return previewItem.sku || 'SKU-DUMPLINGS';

            case 'barcode_value':
            case 'barcode':
            default:
                return previewItem.barcode || previewItem.sku || '62096153723';
        }
    }, [design.symbol_field_source, previewItem, formatPreviewPrice]);

    const handlePrint = () => {
        if (!printRef.current) return;

        const qty = Math.max(1, Number(design.print_qty) || 1);
        const paper = selectedPaperTemplate;

        if (!paper || !paper.label || !paper.label.width || !paper.label.height) {
            shopify.toast.show('Please select a valid paper model before printing.', { duration: 5000, isError: true });
            return;
        }

        let labelHtml = printRef.current.innerHTML;
        labelHtml = `<div class="label-content">${labelHtml}</div>`;

        const rows = Number(paper.rows || 1);
        const columns = Number(paper.columns || 1);
        const labelsPerSheet = rows * columns;
        let sheets = [];

        if (paper.type === 'roll' || labelsPerSheet === 1) {
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
            bodyHtml: sheets.join(''),
            sheetsHtml: sheets.join(''),
            printSettings,
        });

        if (!success) {
            shopify.toast.show('Failed to open print window. Please allow popups.', { duration: 5000, isError: true });
        }
    };

    const handleSubmit = useCallback(async () => {
        if (loading) return;

        if (!name.trim()) {
            setErrorBanner('Template name is required.');
            return;
        }

        if (!brand) {
            setErrorBanner('Please select a paper brand.');
            return;
        }

        if (!model) {
            setErrorBanner('Please select a paper model.');
            return;
        }

        const selectedTemplate = model === 'custom' ? customPaper : PAPER_TEMPLATES?.[brand]?.[model];

        if (!selectedTemplate) {
            setErrorBanner('Invalid paper template selected.');
            return;
        }

        setLoading(true);
        setErrorBanner(null);

        try {
            const createRes = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    template_name: name,
                    description,
                    note,
                    paper_brand: brand,
                    paper_model: model,
                    layout_settings: { ...selectedTemplate },
                }),
            });

            const createResult = await createRes.json();

            if (!createRes.ok || !createResult.success) {
                throw new Error(createResult.message || 'Failed to save template.');
            }

            const newId = createResult.data.id;
            const resolvedDesign = {
                ...design,
                line2_currency_format: design.line2_currency_format || printSettings?.currency_format || 'without_currency',
            };
            const designRes = await fetch(`/api/templates/design/${newId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    ...resolvedDesign,
                    selected_variant_id: selectedVariantId,
                }),
            });

            const designResult = await designRes.json().catch(() => null);

            if (!designRes.ok || designResult?.success === false) {
                throw new Error(designResult?.message || 'Template was created, but the design could not be saved.');
            }

            initialStateRef.current = {
                name,
                description,
                note,
                brand,
                model,
                customPaper: structuredClone(defaultCustomPaper),
                design: structuredClone(design),
                selectedVariantId,
            };

            isDiscardingRef.current = true;
            setIsDirty(false);
            try { shopify?.saveBar?.hide?.(SAVE_BAR_ID); } catch (e) { }

            shopify.toast.show('Template created successfully.');
            navigate('/TemplateList');
        } catch (error) {
            console.error('Save template error:', error);
            setErrorBanner(error.message || 'A server error occurred while saving.');
            setIsDirty(true);
            try { shopify?.saveBar?.show?.(SAVE_BAR_ID); } catch (e) { }
        } finally {
            setLoading(false);
        }
    }, [name, description, note, brand, model, customPaper, design, selectedVariantId, loading, navigate, shopify, printSettings]);

    if (pageLoading) {
        return (
            <s-page heading="Create Barcode Template">
                <TitleBar title="barcodedemo-app" />
                <s-box padding="base" alignContent="center">
                    <s-spinner accessibilityLabel="Loading template data" size="large" />
                </s-box>
            </s-page>
        );
    }

    const paperDimensionsText = selectedPaperTemplate?.label
        ? `${selectedPaperTemplate.label.width} × ${selectedPaperTemplate.label.height} mm`
        : 'Auto';

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button type="button" variant="primary" disabled={loading} onClick={handleSubmit}>
                    {loading ? 'Saving…' : 'Save template'}
                </button>
                <button type="button" disabled={loading} onClick={handleDiscard}>
                    Discard
                </button>
            </ui-save-bar>

            <s-page heading="Create Barcode Template">
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
                    {errorBanner && <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>{errorBanner}</s-banner>}

                    <div style={{ display: 'grid', gridTemplateColumns: '58% 40%', gap: '24px' }}>
                        {/* LEFT CONFIGURATION COLUMN */}
                        <s-stack direction="block" gap="base">
                            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                                <div>
                                    <FieldLabel label="Template Name" tooltip="Enter a name to easily identify this label template." />
                                    <s-text-field value={name} onInput={handleFieldChange(setName)} placeholder="e.g., Standard Dymo Label" />
                                </div>
                                <div>
                                    <FieldLabel label="Internal Note" tooltip="Add a Short note to help you remember details about this template." />
                                    <s-text-area value={note} onInput={handleFieldChange(setNote)} rows={2} />
                                </div>
                            </s-grid>

                            <div>
                                <FieldLabel label="Description" tooltip="Provide a brief description of the template and how it will be used." />
                                <s-text-area value={description} onInput={handleFieldChange(setDescription)} rows={3} />
                            </div>

                            <PaperTemplateSettings
                                brand={brand}
                                model={model}
                                customPaper={customPaper}
                                onBrandChange={(value) => {
                                    if (isDiscardingRef.current) return;
                                    setBrand(value);
                                    setModel(value === 'custom' ? 'custom' : '');
                                }}
                                onModelChange={(value) => {
                                    if (isDiscardingRef.current) return;
                                    setModel(value);
                                }}
                                onCustomChange={(value) => {
                                    if (isDiscardingRef.current) return;
                                    setCustomPaper(value);
                                }}
                            />

                            <s-select label="Preview Product Variant" value={selectedVariantId} onChange={handleVariantChange}>
                                {storeVariants.map((v) => (
                                    <s-option key={v.variant_id} value={v.variant_id}>
                                        {`${v.product_title} (${v.barcode || 'No Barcode'})`}
                                    </s-option>
                                ))}
                            </s-select>

                            <LineControls design={design} handleUpdate={handleDesignUpdate} />

                            <SymbolControls design={design} handleUpdate={handleDesignUpdate} barcodeSettings={barcodeSettings} />
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
                                                    {design.symbol_type === 'BARCODE' ? (
                                                        <BarcodeRenderer
                                                            value={getSymbolTargetValue()}
                                                            field={design.symbol_field_source}
                                                            settings={design}
                                                            barcodeSettings={{ ...(barcodeSettings?.data ?? barcodeSettings), ...design }}
                                                        />
                                                    ) : (
                                                        <QrCodeRenderer value={getSymbolTargetValue()} settings={design} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* PAPER MODEL LAYOUT PREVIEW */
                                <PaperModelPreview brand={brand} model={model} paper={selectedPaperTemplate} />
                            )}

                            {/* PRINT TEST LABEL CARD - ONLY SHOW WHEN BARCODE LABEL PREVIEW TAB IS ACTIVE */}
                            {activePreviewTab === 'label' && (
                                <s-box padding="base" borderWidth="base" borderRadius="base" style={{ background: '#ffffff' }}>
                                    <s-stack direction="block" gap="base">
                                        <s-number-field
                                            label="Print Quantity"
                                            value={design.print_qty || printSettings?.default_print_label_quantity || 1}
                                            min={1}
                                            step={1}
                                            onInput={(e) => handleDesignUpdate('print_qty', Math.max(1, parseInt(e.currentTarget.value) || 1))}
                                        />

                                        <s-button variant="primary" icon="print" onClick={handlePrint}>
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
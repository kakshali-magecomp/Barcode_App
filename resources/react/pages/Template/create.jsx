import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';
import LineControls from '../../components/LineControls';
import SymbolControls from '../../components/SymbolControls';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import QrCodeRenderer from '../../components/QrCodeRenderer';
import PaperTemplateSettings, { PAPER_TEMPLATES } from '../../components/PaperTemplateSettings';
import { openPrintWindow } from '../../components/Printlayout';

const SAVE_BAR_ID = 'create-template-save-bar';

const defaultDesign = { line1_sku: true, line2_name: true, line2_price: false, line2_currency_format: 'without_currency', line2_variant_option1: false, line3_vendor: false, symbol_enabled: true, symbol_type: 'BARCODE', symbol_color: '#000000', symbol_field_source: 'barcode_value', print_qty: 1, currency_code: 'USD', };
const defaultCustomPaper = {
    type: 'sheet',
    paper: {
        width: '',
        height: ''
    },
    label: {
        width: '',
        height: ''
    },
    rows: 1,
    columns: 1,
    gapX: 0,
    gapY: 0,
    marginTop: 0,
    marginLeft: 0,
    roll: null
};
export default function CreateTemplate() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const printRef = useRef(null);
    const initialStateRef = useRef(null);
    const isDiscardingRef = useRef(false);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [customPaper, setCustomPaper] = useState(
        structuredClone(defaultCustomPaper)
    );
    const [printSettings, setPrintSettings] = useState(null);
    const [currencyCode, setCurrencyCode] = useState('USD');
    const [design, setDesign] = useState({ ...defaultDesign });
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);

    const [previewItem, setPreviewItem] = useState({
        title: 'Sample Item',
        sku: 'SKU-1001',
        price: '10.00',
        vendor: 'Vendor',
        option_1: '',
        online_url: '',
        barcode: ''
    });

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

    useEffect(() => {
        let mounted = true;

        async function load() {
            try {
                const [productRes, barcodeRes, printRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/barcode-settings'),
                    fetch('/api/print-settings')
                ]);

                const products = await productRes.json();
                const barcode = await barcodeRes.json();
                console.log('BARCODE SETTINGS RESPONSE:', barcode);
                const print = await printRes.json();
                console.log('Print SETTINGS RESPONSE:', print);
                const storeCurrency = products.currency_code || 'USD';

                if (mounted) {
                    setCurrencyCode(storeCurrency);
                }

                let initialDesign = { ...defaultDesign };
                let initialVariant = '';

                let barcodeData = null;
                if (barcode && barcode.id) {
                    barcodeData = barcode.settings || barcode.data || barcode;
                    setBarcodeSettings(barcodeData);

                    initialDesign = {
                        ...initialDesign,
                        barcode_format: barcodeData?.barcode_format || 'CODE128'
                    };
                }   

                const printSettingsData = print.settings || print.data || print;
                if (print.success) {
                    setPrintSettings(print.settings);

                    initialDesign = {
                        ...initialDesign,

                        print_qty:
                            print.settings.default_print_label_quantity || 1,

                        currency_code:
                            products.currency_code || 'USD',

                        line2_currency_format:
                            print.settings.currency_format ||
                            'without_currency'
                    };

                    if (mounted) {
                        setDesign(initialDesign);
                    }
                }

                if (products.status === 1 && products.variants?.length) {
                    setStoreVariants(products.variants);

                    const selected = products.variants[0];
                    initialVariant = selected.variant_id;

                    if (mounted) {
                        setSelectedVariantId(initialVariant);

                        setPreviewItem({
                            title: selected.product_title,
                            sku: selected.current_sku || 'NO-SKU',
                            barcode: selected.barcode || '',
                            price: selected.price,
                            vendor: selected.vendor,
                            option_1: selected.variant_title !== 'Default Title' ? selected.variant_title : '',
                            online_url: selected.online_url || '',
                            currency_code: selected.currency_code || currencyCode,
                        });
                    }
                }

                initialStateRef.current = {
                    name: '',
                    description: '',
                    note: '',
                    brand: '',
                    model: '',
                    customPaper: structuredClone(defaultCustomPaper),
                    design: structuredClone(initialDesign),
                    selectedVariantId: initialVariant
                };

                if (mounted) {
                    setIsDirty(false);
                    shopify.saveBar.hide(SAVE_BAR_ID);
                    setPageLoading(false);
                }
            } catch (error) {
                console.error('Failed to load template data:', error);
                if (mounted) setPageLoading(false);
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [shopify]);

    useEffect(() => {
        if (!initialStateRef.current || isDiscardingRef.current) return;

        const current = {
            name,
            description,
            note,
            brand,
            model,
            customPaper,
            design,
            selectedVariantId
        };

        const dirty = JSON.stringify(current) !== JSON.stringify(initialStateRef.current);

        if (!isDiscardingRef.current) setIsDirty(dirty);
    }, [name, description, note, brand, model, design, customPaper, selectedVariantId]);

    const handleFieldChange = setter => event => {
        if (isDiscardingRef.current) return;
        setter(event.currentTarget.value);
    };

    const handleDesignUpdate = (key, value) => {
        if (isDiscardingRef.current) return;

        setDesign(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleVariantChange = event => {
        if (isDiscardingRef.current) return;

        const variantId = event.currentTarget.value;

        setSelectedVariantId(variantId);

        const selected = storeVariants.find(item => item.variant_id === variantId);

        if (!selected) return;

        setPreviewItem({
            title: selected.product_title,
            sku: selected.current_sku || 'NO-SKU',
            barcode: selected.barcode || '',
            price: selected.price,
            vendor: selected.vendor,
            option_1: selected.variant_title !== 'Default Title' ? selected.variant_title : '',
            online_url: selected.online_url || '',
            currency_code: selected.currency_code || currencyCode
        });
    };

    const handleDiscard = useCallback(() => {
        const initial = initialStateRef.current;

        if (!initial) return;

        isDiscardingRef.current = true;

        setName(initial.name);
        setDescription(initial.description);
        setNote(initial.note);
        setBrand(initial.brand);
        setModel(initial.model);
        setCustomPaper(
            structuredClone(initial.customPaper || defaultCustomPaper)
        );
        setDesign(structuredClone(initial.design));
        setSelectedVariantId(initial.selectedVariantId);
        setErrorBanner(null);

        const selected = storeVariants.find(
            item => item.variant_id === initial.selectedVariantId
        );

        if (selected) {
            setPreviewItem({
                title: selected.product_title,
                sku: selected.current_sku || 'NO-SKU',
                barcode: selected.barcode || '',
                price: selected.price,
                vendor: selected.vendor,
                option_1: selected.variant_title !== 'Default Title' ? selected.variant_title : '',
                online_url: selected.online_url || '',
                currency_code: selected.currency_code || currencyCode,
            });
        }

        setIsDirty(false);
        shopify.saveBar.hide(SAVE_BAR_ID);

        setTimeout(() => {
            isDiscardingRef.current = false;
            setIsDirty(false);
            shopify.saveBar.hide(SAVE_BAR_ID);
        }, 100);
    }, [storeVariants, shopify]);

    const getCurrencySymbol = useCallback((currency) => {
        try {
            return new Intl.NumberFormat('en', {
                style: 'currency',
                currency,
                currencyDisplay: 'narrowSymbol'
            })
                .formatToParts(0)
                .find(part => part.type === 'currency')?.value || currency;
        } catch {
            return currency;
        }
    }, []);

    const formatPreviewPrice = useCallback(() => {
        const decimals = Number(
            printSettings?.price_decimal_number ?? 2
        );

        let price = Number(previewItem?.price ?? 0);

        // if (price > 999) price /= 100;

        const vat = Number(
            printSettings?.vat_percentage ?? 0
        );

        const amount =
            price + (price * vat) / 100;

        const number = new Intl.NumberFormat('en', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(amount);

        const currency =
            previewItem.currency_code ||
            design.currency_code ||
            currencyCode ||
            'USD';

        const currencyFormat =
            design.line2_currency_format ||
            printSettings?.currency_format ||
            'without_currency';

        if (currencyFormat === 'currency_code') {
            return `${number} ${currency}`;
        }

        if (currencyFormat === 'with_currency') {
            return new Intl.NumberFormat('en', {
                style: 'currency',
                currency,
                currencyDisplay: 'symbol',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(amount);
        }

        return number;
    }, [
        printSettings,
        previewItem?.price,
        previewItem?.currency_code,
        design.currency_code,
        design.line2_currency_format,
        currencyCode
    ]);

    const getSymbolTargetValue = useCallback(() => {
        switch (design.symbol_field_source) {
            case 'product_name':
                return previewItem.title || '';
            case 'product_price':
                return formatPreviewPrice();
            case 'product_vendor':
                return previewItem.vendor || '';
            case 'product_online_url':
                return previewItem.online_url || '';
            case 'barcode_value':
                return previewItem.barcode || '';
            case 'sku_value':
                return previewItem.sku || '';
            default:
                return previewItem.sku || '';
        }
    }, [design.symbol_field_source, previewItem, formatPreviewPrice]);

    const handlePrint = () => {
        if (!printRef.current) return;

        const qty = Math.max(1, Number(design.print_qty) || 1);
        const paper =
            model === 'custom'
                ? customPaper
                : PAPER_TEMPLATES?.[brand]?.[model];

        if (!paper) {
            shopify.toast.show('Please select a paper size.', {
                duration: 5000,
                isError: true
            });
            return;
        }

        if (
            !paper.paper?.width ||
            !paper.paper?.height ||
            !paper.label?.width ||
            !paper.label?.height
        ) {
            shopify.toast.show('Please enter valid paper and label dimensions.', {
                duration: 5000,
                isError: true
            });
            return;
        }

        const labelsPerSheet = Number(paper.rows || 1) * Number(paper.columns || 1);
        const labelHtml = printRef.current.innerHTML;
        const sheets = [];

        for (let start = 0; start < qty; start += labelsPerSheet) {
            let labels = '';

            for (let i = 0; i < Math.min(labelsPerSheet, qty - start); i++) {
                labels += `<div class="label">${labelHtml}</div>`;
            }

            sheets.push(`<div class="print-sheet">${labels}</div>`);
        }

        const success = openPrintWindow({
            bodyHtml: sheets.join(''),
            paperTemplate: paper,
            useJsBarcodeScript: true,
            fontOptions: { fontFactor: .2, fontMin: 2, fontMax: 4 }
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

        const selectedTemplate =
            model === 'custom'
                ? customPaper
                : PAPER_TEMPLATES?.[brand]?.[model];

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
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    template_name: name,
                    description,
                    note,
                    paper_brand: brand,
                    paper_model: model,
                    layout_settings: { ...selectedTemplate }
                })
            });

            const createResult = await createRes.json();

            if (!createRes.ok || !createResult.success) {
                throw new Error(createResult.message || 'Failed to save template.');
            }

            const newId = createResult.data.id;
            const resolvedDesign = {
                ...design,
                line2_currency_format:
                    design.line2_currency_format ||
                    printSettings?.currency_format ||
                    'without_currency',
            };
            const designRes = await fetch(`/api/templates/design/${newId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    ...resolvedDesign,
                    selected_variant_id: selectedVariantId
                })
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
                selectedVariantId
            };

            isDiscardingRef.current = true;
            setIsDirty(false);
            shopify.saveBar.hide(SAVE_BAR_ID);

            shopify.toast.show('Template created successfully.');

            navigate('/TemplateList');
        } catch (error) {
            console.error('Save template error:', error);
            setErrorBanner(error.message || 'A server error occurred while saving.');
            setIsDirty(true);
            shopify.saveBar.show(SAVE_BAR_ID);
        } finally {
            setLoading(false);
        }
    }, [name, description, note, brand, model, customPaper, design, selectedVariantId, loading, navigate, shopify]);

    if (pageLoading) {
        return (
            <s-page heading="Create Barcode Template">
                <s-box padding="loose" alignContent="center">
                    <s-spinner
                        accessibilityLabel="Loading template data"
                        size="large"
                    />
                </s-box>
            </s-page>
        );
    }

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

                    <s-stack direction="block" gap="base">
                        <div style={{ paddingRight: '340px' }}>
                            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                                <s-text-field label="Template Name" value={name} onInput={handleFieldChange(setName)} placeholder="e.g., Standard Dymo Label" details="Enter a name to easily identify this label template." />
                                <s-text-area label="Internal Note" value={note} onInput={handleFieldChange(setNote)} rows={2} details="Add a Short note to help you remember details about this template." />
                            </s-grid>

                            <s-text-area label="Description" value={description} onInput={handleFieldChange(setDescription)} rows={3} details="Provide a brief description of the template and how it will be used." />

                            <PaperTemplateSettings
                                brand={brand}
                                model={model}
                                customPaper={customPaper}
                                onBrandChange={value => {
                                    if (isDiscardingRef.current) return;
                                    setBrand(value);
                                    setModel(value === 'custom' ? 'custom' : '');
                                }}
                                onModelChange={value => {
                                    if (isDiscardingRef.current) return;
                                    setModel(value);
                                }}
                                onCustomChange={value => {
                                    if (isDiscardingRef.current) return;
                                    setCustomPaper(value);
                                }}
                            />

                            <s-select label="Preview Product Variant" value={selectedVariantId} onChange={handleVariantChange}>
                                {storeVariants.map(v =>
                                    <s-option key={v.variant_id} value={v.variant_id}>
                                        {`${v.product_title} (${v.barcode || 'No Barcode'})`}
                                    </s-option>
                                )}
                            </s-select>

                            <LineControls design={design} handleUpdate={handleDesignUpdate} />

                            <SymbolControls design={design} handleUpdate={handleDesignUpdate} barcodeSettings={barcodeSettings} />
                        </div>
                    </s-stack>
                </s-section>
            </s-page>

            <div style={{ position: 'fixed', top: '140px', right: '85px', width: '330px', maxHeight: 'calc(100vh - 185px)', overflowY: 'auto', background: '#fff', border: '1px solid #e1e3e5', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div ref={printRef} style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                        {design.line1_sku && <div className="print-sku">{previewItem.sku}</div>}

                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginBottom: 5 }}>
                            {design.line2_name && <span style={{ fontWeight: 700 }}>{previewItem.title}</span>}
                            {design.line2_variant_option1 && previewItem.option_1 && <span style={{ color: '#666' }}>• {previewItem.option_1}</span>}
                            {design.line2_price && <span style={{ color: '#000', fontWeight: 700 }}>{formatPreviewPrice()}</span>}
                        </div>

                        {design.line3_vendor && <span style={{ fontWeight: 500, color: '#666' }}>{previewItem.vendor}</span>}

                        {design.symbol_enabled && (design.symbol_type === 'BARCODE' ?
                            <BarcodeRenderer
                                value={getSymbolTargetValue()}
                                field={design.symbol_field_source}
                                settings={design}
                                barcodeSettings={{ ...(barcodeSettings?.data ?? barcodeSettings), ...design }}
                            /> :
                            <QrCodeRenderer value={getSymbolTargetValue()} settings={design} />
                        )}
                    </div>

                    <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <s-number-field
                                label="Print Quantity"
                                value={design.print_qty || printSettings?.default_print_label_quantity || 1}
                                min={1}
                                step={1}
                                onInput={e => handleDesignUpdate('print_qty', Math.max(1, parseInt(e.currentTarget.value) || 1))}
                            />

                            <s-button variant="primary" icon="print" onClick={handlePrint}>
                                Print
                            </s-button>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
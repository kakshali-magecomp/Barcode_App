import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useNavigate } from 'react-router-dom';
import LineControls from '../../components/LineControls';
import SymbolControls from '../../components/SymbolControls';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import QrCodeRenderer from '../../components/QrCodeRenderer';
import PaperTemplateSettings from "../../components/PaperTemplateSettings";
const SAVE_BAR_ID = 'create-template-save-bar';

const defaultDesign = {
    line1_sku: true,
    line2_name: true,
    line2_price: false,
    line2_variant_option1: false,
    line3_vendor: false,
    symbol_enabled: true,
    symbol_type: 'BARCODE',
    symbol_color: '#000000',
    symbol_field_source: 'barcode_value',
    barcode_format: 'CODE128',
    print_qty: 1,
};

export default function CreateTemplate() {
    const shopify = useAppBridge();
    const navigate = useNavigate();
    const printRef = useRef(null);

    // Template info state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [note, setNote] = useState('');
    const [brand, setBrand] = useState('');
    const [model, setModel] = useState('');
    const [printSettings, setPrintSettings] = useState(null);
    const [design, setDesign] = useState(defaultDesign);

    // Preview state
    const [previewItem, setPreviewItem] = useState({
        title: 'Sample Item',
        sku: 'SKU-1001',
        price: '10.00',
        vendor: 'Vendor',
        option_1: '',
        online_url: '',
        barcode: '',
    });
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [barcodeSettings, setBarcodeSettings] = useState({});

    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    const brandOptions = [
        { label: 'Dymo', value: 'dymo' },
        { label: 'Zebra', value: 'zebra' },
        { label: 'Avery', value: 'avery' }
    ];

    const modelOptionsMap = {
        '': [],
        'dymo': [
            { label: '30334 (Jewelry Label)', value: '30334' },
            { label: '30252 (Address Label)', value: '30252' }
        ],
        'zebra': [
            { label: 'Z-Select 4000D (2" x 1")', value: '4000d-2x1' },
            { label: 'Z-Select 4000D (4" x 6")', value: '4000d-4x6' }
        ],
        'avery': [
            { label: '5160 (Address 30-per-sheet)', value: '5160' },
            { label: '5167 (Return Address)', value: '5167' }
        ]
    };

    const PAPER_TEMPLATES = {
        dymo: {
            "30334": { name: "Jewelry Label", paper: { width: 57, height: 32 }, label: { width: 57, height: 32 }, rows: 1, columns: 1, gapX: 0, gapY: 0, marginTop: 0, marginLeft: 0 },
            "30252": { name: "Address Label", paper: { width: 89, height: 28 }, label: { width: 89, height: 28 }, rows: 1, columns: 1, gapX: 0, gapY: 0, marginTop: 0, marginLeft: 0 }
        },
        zebra: {
            "4000d-4x6": { name: "Shipping Label", paper: { width: 101.6, height: 152.4 }, label: { width: 101.6, height: 152.4 }, rows: 1, columns: 1, gapX: 0, gapY: 0 },
            "4000d-2x1": { name: "Small Label", paper: { width: 50.8, height: 25.4 }, label: { width: 50.8, height: 25.4 }, rows: 1, columns: 1, gapX: 0, gapY: 0 }
        },
        avery: {
            "5160": { name: "Address", paper: { width: 215.9, height: 279.4 }, label: { width: 66.7, height: 25.4 }, rows: 10, columns: 3, gapX: 3.2, gapY: 0, marginTop: 12.7, marginLeft: 4.8 },
            "5167": { name: "ReturnAddress", paper: { width: 215.9, height: 279.4 }, label: { width: 44.5, height: 12.7 }, rows: 20, columns: 4, gapX: 5, gapY: 0, marginTop: 12.7, marginLeft: 7.5 }
        }
    };

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);


    useEffect(() => {
        async function loadPreviewData() {
            try {
                const [productRes, barcodeRes, printRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/barcode-settings'),
                    fetch('/api/print-settings'),
                ]);
                const products = await productRes.json();
                const barcode = await barcodeRes.json();
                const print = await printRes.json();

                if (barcode.success) {
                    setBarcodeSettings(barcode.settings || barcode.data || barcode);
                }
                if (print.success) {
                    setPrintSettings(print.settings);

                    const snapshotFormat =
                        print.settings.currency_format === 'with_currency' ? '${amount}' :
                            print.settings.currency_format === 'currency_code' ? '{amount} USD' :
                                '{amount}';
                    setDesign((prev) => ({
                        ...prev,
                        print_qty: print.settings.default_print_label_quantity || 1,
                        line2_currency_format: prev.line2_currency_format || snapshotFormat,
                    }));
                }

                if (products.status === 1 && products.variants?.length) {
                    setStoreVariants(products.variants);
                    const selected = products.variants[0];
                    setSelectedVariantId(selected.variant_id);
                    setPreviewItem({
                        title: selected.product_title,
                        sku: selected.current_sku || 'NO-SKU',
                        barcode: selected.barcode || '',
                        price: selected.price,
                        vendor: selected.vendor,
                        option_1:
                            selected.variant_title !== 'Default Title' ? selected.variant_title : '',
                        online_url: selected.online_url || '',
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadPreviewData();
    }, []);

    const handleFieldChange = (setter) => (event) => {
        setter(event.currentTarget.value);
        setIsDirty(true);
    };

    const handleBrandChange = (event) => {
        setBrand(event.currentTarget.value);
        setModel('');
        setIsDirty(true);
    };

    const handleDesignUpdate = (key, value) => {
        setDesign((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleVariantChange = (event) => {
        const variantId = event.currentTarget.value;
        setSelectedVariantId(variantId);
        const selected = storeVariants.find((item) => item.variant_id === variantId);
        if (!selected) return;
        setPreviewItem({
            title: selected.product_title,
            sku: selected.current_sku || 'NO-SKU',
            barcode: selected.barcode || '',
            price: selected.price,
            vendor: selected.vendor,
            option_1: selected.variant_title !== 'Default Title' ? selected.variant_title : '',
            online_url: selected.online_url || '',
        });
        setIsDirty(true);
    };

    const handleDiscard = useCallback(() => {
        setName('');
        setDescription('');
        setNote('');
        setBrand('');
        setModel('');
        setDesign(defaultDesign);
        setIsDirty(false);
        setErrorBanner(null);
    }, []);

    const getSymbolTargetValue = () => {
        switch (design.symbol_field_source) {
            case 'product_name':
                return previewItem.title || '';
            case 'product_price':
                return previewItem.price || '';
            case 'product_online_url':
                return previewItem.online_url || '';
            case 'barcode_value':
                return previewItem.barcode || '';
            case 'sku_value':
                return previewItem.sku || '';
            default:
                return previewItem.sku || '';
        }
    };

    const formatPreviewPrice = () => {
        const decimals = Number(
            printSettings?.price_decimal_number ?? 2
        );

        // Original Shopify variant price
        let price = Number(previewItem?.price ?? 0);

        // If price accidentally comes as cents (2086), convert to dollars
        if (price > 999) {
            price = price / 100;
        }

        // VAT CALCULATION
        const vatPercentage = Number(
            printSettings?.vat_percentage ?? 0
        );

        const vatAmount = (price * vatPercentage) / 100;

        // Price including VAT
        const priceWithVat = price + vatAmount;

        // Apply decimal setting AFTER VAT calculation
        const amount = priceWithVat.toFixed(decimals);

        const format = design.line2_currency_format || "{amount}";
        return format.replace("{amount}", amount);
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const qty = Math.max(1, Number(design.print_qty) || 1);
        const paper = PAPER_TEMPLATES?.[brand]?.[model];

        if (!paper) {
            shopify.toast.show("Please select a paper brand and paper model.");
            return;
        }

        const paperWidth = Number(paper.paper.width);
        const paperHeight = Number(paper.paper.height);
        const labelWidth = Number(paper.label.width);
        const labelHeight = Number(paper.label.height);
        const rows = Number(paper.rows || 1);
        const columns = Number(paper.columns || 1);
        const gapX = Number(paper.gapX || 0);
        const gapY = Number(paper.gapY || 0);
        const marginTop = Number(paper.marginTop || 0);
        const marginLeft = Number(paper.marginLeft || 0);
        const textPt = Math.max(5, Math.min(11, Math.round(labelHeight * 0.28)));
        const barcodeHeightMm = Math.max(4, labelHeight * 0.4);

        let labels = "";
        for (let i = 0; i < qty; i++) {
            labels += `<div class="label">${printRef.current.innerHTML}</div>`;
        }

        const printWindow = window.open("", "_blank", "width=1000,height=800");
        if (!printWindow) {
            shopify.toast.show("Please allow pop-ups to print.");
            return;
        }
        const rollPageBreakCss =
            rows === 1 && columns === 1
                ? `
        .print-sheet { display: block !important; }
        .label { page-break-after: always; break-after: page; }
        .label:last-child { page-break-after: auto; }
        `
                : "";

        printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${paper.name || "Barcode Labels"}</title>
        <style>
            @page {
                size: ${paperWidth}mm ${paperHeight}mm;
                margin: 0;
            }
            * { box-sizing: border-box; }
            html, body {
                margin: 0;
                padding: 0;
                width: ${paperWidth}mm;
                min-height: ${paperHeight}mm;
                background: #ffffff;
                font-family: Arial, Helvetica, sans-serif;
            }
            .print-sheet {
                width: ${paperWidth}mm;
                min-height: ${paperHeight}mm;
                display: grid;
                grid-template-columns: repeat(${columns}, ${labelWidth}mm);
                grid-template-rows: repeat(${rows}, ${labelHeight}mm);
                column-gap: ${gapX}mm;
                row-gap: ${gapY}mm;
                padding-top: ${marginTop}mm;
                padding-left: ${marginLeft}mm;
                align-content: start;
                justify-content: start;
                overflow: hidden;
            }
            ${rollPageBreakCss}
            .label {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                padding: ${Math.max(0.5, labelHeight * 0.05)}mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                overflow: hidden;
                page-break-inside: avoid;
                break-inside: avoid;
            }
            /* Override whatever pixel font-size the on-screen preview
               baked in via inline styles — those were tuned for a large
               on-screen box, not the real physical label size. Scaled
               dynamically per paper type instead of one fixed value. */
            .label * {
                max-width: 100%;
                font-size: ${textPt}pt !important;
                line-height: 1.15 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .label div {
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            .label strong,
            .label b {
                font-weight: 700 !important;
            }
            .label svg,
            .label img {
                display: block;
                max-width: 95%;
                height: ${barcodeHeightMm}mm !important;
                width: auto !important;
                margin: ${Math.max(0.3, labelHeight * 0.03)}mm auto !important;
                flex-shrink: 0;
            }
            @media print {
                html, body {
                    width: ${paperWidth}mm;
                    height: ${paperHeight}mm;
                    margin: 0;
                    padding: 0;
                }
                .print-sheet {
                    width: ${paperWidth}mm;
                    min-height: ${paperHeight}mm;
                }
                .label {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="print-sheet">
            ${labels}
        </div>
        <script>
            window.onload = function () {
                setTimeout(function () {
                    window.focus();
                    window.print();
                }, 500);
            };
        </script>
    </body>
    </html>
`);
        printWindow.document.close();
    };

    const handleSubmit = useCallback(async () => {
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

        const selectedTemplate = PAPER_TEMPLATES?.[brand]?.[model];
        if (!selectedTemplate) {
            setErrorBanner('Invalid paper template selected.');
            return;
        }

        setLoading(true);
        setErrorBanner(null);

        try {
            const createRes = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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

            await fetch(`/api/templates/design/${newId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...design, selected_variant_id: selectedVariantId }),
            });

            shopify.toast.show('Template created successfully.');
            setIsDirty(false);
            navigate('/TemplateList');
        } catch (error) {
            console.error(error);
            setErrorBanner(error.message || 'A server error occurred while saving.');
        } finally {
            setLoading(false);
        }
    }, [name, description, note, brand, model, design, selectedVariantId, navigate, shopify]);

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button variant="primary" loading={loading ? "" : undefined} onClick={handleSubmit}>
                    Save template
                </button>
                <button onClick={handleDiscard}>Discard</button>
            </ui-save-bar>

            <s-page heading="Create Barcode Template">
                <s-section>
                    <s-link href="/TemplateList">← Back to Template List</s-link>
                </s-section>

                <s-section>
                    {errorBanner && (
                        <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            {errorBanner}
                        </s-banner>
                    )}

                    <s-stack direction="block" gap="base">
                        <div style={{ paddingRight: '340px' }}>
                            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                                <s-text-field
                                    label="Template Name"
                                    value={name}
                                    onInput={handleFieldChange(setName)}
                                    placeholder="e.g., Standard Dymo Label"
                                />
                                <s-text-area
                                    label="Internal Note"
                                    value={note}
                                    onInput={handleFieldChange(setNote)}
                                    rows={2}
                                />
                            </s-grid>

                            <s-text-area
                                label="Description"
                                value={description}
                                onInput={handleFieldChange(setDescription)}
                                rows={3}
                            />

                            <PaperTemplateSettings
                                brand={brand}
                                model={model}
                                onBrandChange={(value) => {
                                    setBrand(value);
                                    setIsDirty(true);
                                }}
                                onModelChange={(value) => {
                                    setModel(value);
                                    setIsDirty(true);
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
                            <SymbolControls
                                design={design}
                                handleUpdate={handleDesignUpdate}
                                barcodeSettings={barcodeSettings}
                            />
                        </div>
                    </s-stack>
                </s-section>
            </s-page>

            {/* Fixed preview panel — same pattern used in DesignCanvasEdit */}
            <div
                style={{
                    position: 'fixed',
                    top: '140px',
                    right: '80px',
                    width: '330px',
                    maxHeight: 'calc(100vh - 185px)',
                    overflowY: 'auto',
                    background: '#fff',
                    border: '1px solid #e1e3e5',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    padding: '16px',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div
                            ref={printRef}
                            style={{
                                minHeight: '220px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            {design.line1_sku && (
                                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                                    {previewItem.sku}
                                </div>
                            )}

                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    gap: 6,
                                    marginBottom: 20,
                                }}
                            >
                                {design.line2_name && (
                                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                                        {previewItem.title}
                                    </span>
                                )}
                                {design.line2_variant_option1 && previewItem.option_1 && (
                                    <span style={{ color: '#666' }}>• {previewItem.option_1}</span>
                                )}
                                {design.line2_price && (
                                    <span style={{ color: '#008060', fontWeight: 700 }}>
                                        {formatPreviewPrice()}
                                    </span>
                                )}
                            </div>

                            {design.symbol_enabled && (
                                design.symbol_type === 'BARCODE' ? (
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
                                    <QrCodeRenderer value={getSymbolTargetValue()} settings={design} />
                                )
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e1e3e5', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <s-number-field
                                label="Print Quantity"
                                value={String(design.print_qty || printSettings?.default_print_label_quantity || 1)}
                                min="1"
                                step="1"
                                onInput={(event) =>
                                    handleDesignUpdate(
                                        'print_qty',
                                        Math.max(1, parseInt(event.currentTarget.value) || 1)
                                    )
                                }
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
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';
import { useParams, useNavigate } from 'react-router-dom';
import LineControls from '../../components/LineControls';
import SymbolControls from '../../components/SymbolControls';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import QrCodeRenderer from '../../components/QrCodeRenderer';

const SAVE_BAR_ID = 'designer-bar';

export default function DesignCanvas() {
    
    const shopify = useAppBridge();
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef(null);
    const [printSettings, setPrintSettings] = useState({});
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const [pageLoading, setPageLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [originalDesign, setOriginalDesign] = useState(null);
    const [templateTitle, setTemplateTitle] = useState("Template Designer");
    const [originalVariantId, setOriginalVariantId] = useState("");
    const [previewItem, setPreviewItem] = useState({ title: 'Sample Item', sku: 'SKU-1001', price: '10.00', vendor: 'Vendor', option_1: '' });
    const [design, setDesign] = useState({ symbol_type: 'QR', symbol_color: '#000000', symbol_field_source: 'barcode_value', print_qty: 1 });

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

    useEffect(() => {
        async function loadTemplateTitle() {
            try {
                const response = await fetch(`/api/templates/${id}`);
                const json = await response.json();

                if (json.success) {
                    setTemplateTitle(json.data.template_name);
                }
            } catch (error) {
                console.error("Failed to load template title:", error);
            }
        }

        if (id) {
            loadTemplateTitle();
        }
    }, [id]);

    const getSymbolTargetValue = useCallback(() => {
        switch (design.symbol_field_source) {
            case "product_name":
                return (
                    previewItem.product_title ||
                    previewItem.title ||
                    previewItem.name ||
                    previewItem.product?.title ||
                    ""
                );
            case "product_price":
                return previewItem.price;
            case "product_online_url":
                if (previewItem.online_url) {
                    return previewItem.online_url;
                }
                return "";
            case "barcode_value":
                return previewItem.barcode || "";
            case "sku_value":
                return previewItem.sku || "";
            default:
                return previewItem.sku || "";
        }
    }, [design.symbol_field_source, previewItem]);

    const formatPrice = useCallback(
        (price) => {
            const decimals = printSettings.price_decimal_number ?? 2;
            const formatted = Number(price).toFixed(decimals);
            if (printSettings.currency_format === "without_currency") {
                return formatted;
            }
            return `$${formatted}`;
        },
        [printSettings]
    );

    const handleDiscard = () => {
        if (!originalDesign) return;
        setDesign(JSON.parse(JSON.stringify(originalDesign)));
        setSelectedVariantId(originalVariantId);
        const selected = storeVariants.find(
            item => item.variant_id === originalVariantId
        );
        if (selected) {
            setPreviewItem({
                title: selected.product_title,
                sku: selected.current_sku || "NO-SKU",
                current_sku: selected.current_sku || "",
                barcode: selected.barcode || "",
                price: selected.price,
                vendor: selected.vendor,
                option_1:
                    selected.variant_title !== "Default Title"
                        ? selected.variant_title
                        : "",
                online_url: selected.online_url || "",
                handle: selected.handle || "",
            });
        }
        setIsDirty(false);
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [tRes, pRes, sRes, bRes] = await Promise.all([
                    fetch(`/api/templates/design/${id}`),
                    fetch('/api/products'),
                    fetch('/api/print-settings'),
                    fetch('/api/barcode-settings'),
                ]);
                let savedVariantId = "";
                let defaultPrintQty = 1;

                if (sRes.ok) {
                    const settings = await sRes.json();
                    if (settings.success) {
                        setPrintSettings(settings.settings);
                        defaultPrintQty = settings.settings.default_print_label_quantity || 1;
                    }
                }
                if (bRes.ok) {
                    const barcode = await bRes.json();
                    setBarcodeSettings(barcode);
                }
                if (tRes.ok) {
                    const r = await tRes.json();
                    if (r.success) {
                        const designData = {
                            ...r.data,
                            barcode_format: r.data.barcode_format || "CODE128",
                            print_qty: defaultPrintQty,
                        };
                        setDesign(designData);
                        setOriginalDesign(structuredClone(designData));
                        setOriginalVariantId(savedVariantId);
                        setIsDirty(false);
                        savedVariantId = r.data.selected_variant_id || "";
                    }
                }
                if (pRes.ok) {
                    const r = await pRes.json();
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
                            handle: selected.handle || "",
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

    const handleUpdate = (key, value) => { setIsDirty(true); setDesign(prev => ({ ...prev, [key]: value })); };

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

    const handlePrint = () => {
        if (!printRef.current) return;
        const qty = Number(design.print_qty) || 1;
        let labels = "";
        for (let i = 0; i < qty; i++) {
            labels += `<div class="label">${printRef.current.innerHTML}</div>`;
        }
        const printWindow = window.open("", "", "width=900,height=700");
        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Print Barcode</title>
<style>
body{margin:15px;display:flex;flex-wrap:wrap;gap:12px;font-family:Arial,sans-serif;justify-content:flex-start;}
.label{width:250px;border:1px solid #ddd;border-radius:8px;padding:15px;text-align:center;page-break-inside:avoid;}
img{max-width:100%;}
svg{max-width:100%;}
@media print{body{margin:0;gap:10px;}.label{border:none;page-break-inside:avoid;}}
</style>
</head>
<body>
${labels}
</body>
</html>
`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const formatPreviewPrice = () => {
        const format = design.line2_currency_format || "${amount}";
        const amount = Number(previewItem.price || 0).toFixed(2);
        return format.replace("{amount}", amount);
    };

    if (pageLoading) {
        return (
            <s-page heading="Template Designer">
                <s-box padding="loose" alignContent="center">
                    <s-spinner accessibilityLabel="Loading template designer" size="large" />
                </s-box>
            </s-page>
        );
    }

    return (
        <>
           
            <ui-save-bar id={SAVE_BAR_ID}>
                <button variant="primary" onClick={handleSave} disabled={loading || undefined}>
                    Save Design
                </button>
                <button onClick={handleDiscard}>Discard</button>
            </ui-save-bar>

            <s-page heading={`${templateTitle} - Design`}>
                <s-section>
                    
                    <s-link href="/TemplateList">← Back to Templates</s-link>
                </s-section>

                <s-section>
                    <div style={{ width: "58%", marginBottom: "5px" }}>
                        <s-select
                            label="Preview Product Variant Context"
                            value={selectedVariantId}
                            onChange={(event) => {
                                const variantId = event.currentTarget.value;
                                setSelectedVariantId(variantId);
                                const selected = storeVariants.find(item => item.variant_id === variantId);
                                if (!selected) return;
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
                                    online_url: selected.online_url || "",
                                    handle: selected.handle || "",
                                });
                            }}
                        >
                            {storeVariants.map(v => (
                                <s-option key={v.variant_id} value={v.variant_id}>
                                    {`${v.product_title} (${v.barcode || 'No Barcode'})`}
                                </s-option>
                            ))}
                        </s-select>
                    </div>
                </s-section>

                <s-section>
                    <div style={{ display: 'grid', gridTemplateColumns: '58% 40%', gap: '24px' }}>
                        <s-stack direction="block" gap="base">
                            {errorBanner && (
                                <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                                    {errorBanner}
                                </s-banner>
                            )}
                            <LineControls design={design} handleUpdate={handleUpdate} />
                            <SymbolControls design={design} handleUpdate={handleUpdate} barcodeSettings={barcodeSettings} />
                        </s-stack>

                        <div
                            style={{
                                position: "sticky",
                                top: "70px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                                alignSelf: "flex-start",
                            }}
                        >
                            {/* Preview Card */}
                            <s-box padding="tight" borderWidth="base" borderRadius="base">
                                <div ref={printRef}>
                                    <div
                                        style={{
                                            minHeight: "220px",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        {design.line1_sku && (
                                            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                                                {previewItem.sku}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                justifyContent: "center",
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
                                                <span style={{ color: "#666" }}>
                                                    • {previewItem.option_1}
                                                </span>
                                            )}

                                            {design.line2_price && (
                                                <span style={{ color: "#008060", fontWeight: 700 }}>
                                                    {formatPreviewPrice()}
                                                </span>
                                            )}
                                        </div>

                                        {design.symbol_enabled && (
                                            design.symbol_type === "BARCODE" ? (
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
                                            )
                                        )}
                                    </div>
                                </div>
                            </s-box>

                            {/* Print Card */}
                            <s-box padding="base" borderWidth="base" borderRadius="base">
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
                                        Print
                                    </s-button>
                                </s-stack>
                            </s-box>
                        </div>
                    </div>
                </s-section>
            </s-page>
        </>
    );
}
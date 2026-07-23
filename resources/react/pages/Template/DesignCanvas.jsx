import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Page, Card, Select, TextField, Box, Frame, Toast, BlockStack, Spinner, Grid, Banner, Layout, Button } from '@shopify/polaris';
import { useAppBridge, SaveBar } from '@shopify/app-bridge-react';
import { useParams, useNavigate } from 'react-router-dom';
import LineControls from '../../components/LineControls';
import SymbolControls from '../../components/SymbolControls';
import BarcodeRenderer from '../../components/BarcodeRenderer';
import QrCodeRenderer from '../../components/QrCodeRenderer';

export default function DesignCanvas() {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef(null);
    const [printSettings, setPrintSettings] = useState({});
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const [pageLoading, setPageLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [previewItem, setPreviewItem] = useState({ title: 'Sample Item', sku: 'SKU-1001', price: '10.00', vendor: 'Vendor', option_1: '' });
    const [design, setDesign] = useState({ symbol_type: 'QR', symbol_color: '#000000', symbol_field_source: 'barcode_value', print_qty: 1 });

    const getSymbolTargetValue = useCallback(() => {
        switch (design.symbol_field_source) {
            case "product_name":
                return previewItem.title;

            case "product_price":
                return previewItem.price;

            case "product_online_url":
                // Shopify already gives us the real URL
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

    }, [design, previewItem]);

    const formatPrice = useCallback(
        (price) => {
            const decimals =
                printSettings.price_decimal_number ?? 2;

            const formatted = Number(price).toFixed(decimals);

            if (
                printSettings.currency_format ===
                "without_currency"
            ) {
                return formatted;
            }

            return `$${formatted}`;
        },
        [printSettings]
    );


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

                        defaultPrintQty =
                            settings.settings.default_print_label_quantity || 1;
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
                            print_qty: defaultPrintQty,
                        };

                        console.log("Loaded Design:", designData);

                        setDesign(designData);

                        setIsDirty(true);
                        savedVariantId =
                            r.data.selected_variant_id || "";
                    }
                } if (pRes.ok) {
                    const r = await pRes.json();
                    if (r.status === 1 && r.variants?.length > 0) {
                        setStoreVariants(r.variants);
                        const selected =
                            r.variants.find(
                                item => item.variant_id === savedVariantId
                            ) || r.variants[0];

                        console.log("Selected Variant");
                        console.log(selected);
                        console.log("ONLINE URL:", selected.online_url);
                        console.log("HANDLE:", selected.handle);

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
            } catch { setErrorBanner("Failed to communicate with template design configurations."); }
            finally { setPageLoading(false); setIsDirty(true); }
        }
        loadData();
    }, [id, fetch]);


    const handleUpdate = (key, value) => { setIsDirty(true); setDesign(prev => ({ ...prev, [key]: value })); };
    const handleSave = useCallback(async () => {
        setLoading(true); setErrorBanner(null);
        try {
            const res = await fetch(`/api/templates/design/${id}`,
                {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...design,
                        selected_variant_id: selectedVariantId,
                    })
                });

            const result = await res.json();
            if (result.success) {
                setToastActive(true);
                setIsDirty(false);
                setTimeout(() => {
                    navigate("/TemplateList");
                }, 1000);
            }
            else {
                setErrorBanner(result.message);
            }
        } catch { setErrorBanner("Could not sync layout profiles to database table parameters."); }
        finally { setLoading(false); }
    }, [id, design, fetch, selectedVariantId]);

    const handlePrint = () => {

        if (!printRef.current) return;

        const qty = Number(design.print_qty) || 1;

        let labels = "";

        for (let i = 0; i < qty; i++) {

            labels += `
            <div class="label">
                ${printRef.current.innerHTML}
            </div>
        `;

        }

        const printWindow = window.open(
            "",
            "",
            "width=900,height=700"
        );

        printWindow.document.write(`
<!DOCTYPE html>

<html>

<head>

<title>Print Barcode</title>

<style>

body{
    margin:15px;
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    font-family:Arial,sans-serif;
    justify-content:flex-start;
}

.label{

    width:250px;

    border:1px solid #ddd;

    border-radius:8px;

    padding:15px;

    text-align:center;

    page-break-inside:avoid;

}

img{

    max-width:100%;

}

svg{

    max-width:100%;

}

@media print{

    body{

        margin:0;

        gap:10px;

    }

    .label{

        border:none;

        page-break-inside:avoid;

    }

}

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

    if (pageLoading) return <Box padding="1200" align="center"><Spinner size="large" /></Box>;
    return (
        <Frame>
            <SaveBar id="designer-bar" open={isDirty}>
                <button
                    variant="primary"
                    onClick={handleSave}
                    disabled={loading}
                >
                    Save Design
                </button>
                <button
                    onClick={() => {
                        setIsDirty(false);
                    }}
                >
                    Discard
                </button>
            </SaveBar>
            <Page title="Template Designer" backAction={{ content: 'Templates', url: '/TamplateCreate/${id}' }}>
                <BlockStack gap="400">
                    <div
                        style={{
                            width: "58%",
                            marginBottom: "5px",
                        }}
                    >
                        <Card padding="400">
                            <Select label="Preview Product Variant Context"
                                options={storeVariants.map(v => ({ label: `${v.product_title} (${v.current_sku || 'No SKU'})`, value: v.variant_id }))}
                                value={selectedVariantId}
                                onChange={(id) => {
                                    setSelectedVariantId(id);
                                    const selected = storeVariants.find(
                                        item => item.variant_id === id
                                    );

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
                                }} />
                        </Card>
                    </div>
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 7, lg: 7 }}>
                            <BlockStack gap="400">
                                {errorBanner && <Banner tone="critical"><p>{errorBanner}</p></Banner>}
                                <LineControls design={design} handleUpdate={handleUpdate} />
                                <SymbolControls design={design} handleUpdate={handleUpdate} />
                            </BlockStack>
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 5, lg: 5 }}>
                            <Layout.Section variant="oneThird">
                                <div
                                    style={{
                                        position: "fixed",
                                        top: "70px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "16px",
                                        alignSelf: "flex-start",
                                    }}
                                >
                                    {/* Preview Card */}
                                    <Card padding="300">
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
                                                    <div
                                                        style={{
                                                            fontWeight: 600,
                                                            marginBottom: 8,
                                                            fontSize: 14,
                                                        }}
                                                    >
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
                                                        <span
                                                            style={{
                                                                fontWeight: 700,
                                                                fontSize: 16,
                                                            }}
                                                        >
                                                            {previewItem.title}
                                                        </span>
                                                    )}

                                                    {design.line2_variant_option1 &&
                                                        previewItem.option_1 && (
                                                            <span
                                                                style={{
                                                                    color: "#666",
                                                                }}
                                                            >
                                                                • {previewItem.option_1}
                                                            </span>
                                                        )}

                                                    {design.line2_price && (
                                                        <span
                                                            style={{
                                                                color: "#008060",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {formatPreviewPrice()}
                                                        </span>
                                                    )}
                                                </div>
                                                {design.symbol_enabled && (
                                                    design.symbol_type === "BARCODE" ? (
                                                        <BarcodeRenderer
                                                            value={getSymbolTargetValue()}
                                                            settings={design}
                                                            barcodeSettings={
                                                                barcodeSettings.data ??
                                                                barcodeSettings
                                                            }
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
                                    </Card>

                                    {/* Print Card */}
                                    <Card padding="400">

                                        <BlockStack gap="300">

                                            <TextField
                                                label="Print Quantity"
                                                type="number"
                                                value={String(design.print_qty || 1)}
                                                onChange={(value) =>
                                                    handleUpdate(
                                                        "print_qty",
                                                        Math.max(
                                                            1,
                                                            parseInt(value) || 1
                                                        )
                                                    )
                                                }
                                                autoComplete="off"
                                            />

                                            <Button
                                                variant="primary"
                                                fullWidth
                                                onClick={handlePrint}
                                            >
                                                Print
                                            </Button>

                                        </BlockStack>

                                    </Card>

                                </div>

                            </Layout.Section>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
                {toastActive && <Toast content="Template parameters saved to store!" onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}

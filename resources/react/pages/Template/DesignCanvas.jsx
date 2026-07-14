import React, { useState, useEffect, useCallback } from 'react';
import { Page, Card, Select, TextField, Box, Frame, Toast, BlockStack, Spinner, Grid, Banner } from '@shopify/polaris';
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
    const [printSettings, setPrintSettings] = useState({});
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

                // Fallback
                // if (previewItem.handle) {
                //     return `https://${window.location.hostname}/products/${previewItem.handle}`;
                // }

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
                const [tRes, pRes, sRes] = await Promise.all([
                    fetch(`/api/templates/design/${id}`),
                    fetch('/api/products'),
                    fetch('/api/print-settings')
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

                if (tRes.ok) {
                    const r = await tRes.json();

                    if (r.success) {

                        setDesign({
                            ...r.data,
                            print_qty: defaultPrintQty,
                        });

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

                            online_url: selected.online_url || "",
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

    const handleTestPrintDownload = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/products/print-pdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/pdf",
                },
                body: JSON.stringify({
                    template_id: id,
                    variant_id: selectedVariantId,

                    product_title: previewItem.title,
                    sku: previewItem.sku,
                    barcode: previewItem.barcode,
                    online_url: previewItem.online_url,
                    handle: previewItem.handle,

                    price: formatPrice(previewItem.price),
                    vendor: previewItem.vendor,
                    option_1: previewItem.option_1,

                    print_qty: design.print_qty,
                    design,
                })
            });

            console.log("Status:", res.status);
            console.log("Content-Type:", res.headers.get("content-type"));

            if (!res.ok) {
                const error = await res.text();
                console.error(error);
                alert(error);
                return;
            }

            const blob = await res.blob();

            console.log(blob.type);

            if (blob.type !== "application/pdf") {
                const text = await blob.text();
                console.log(text);
                alert("Server didn't return a PDF. Check console.");
                return;
            }

            const url = window.URL.createObjectURL(blob);

            window.open(url);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) return <Box padding="1200" align="center"><Spinner size="large" /></Box>;
    console.log("Preview Item", previewItem);
    console.log("QR Value", getSymbolTargetValue());
    console.log("Field", design.symbol_field_source);
    console.log("Preview Item:", previewItem);
    console.log("QR Value:", getSymbolTargetValue());
    console.log("Field:", design.symbol_field_source);

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
            </SaveBar>            <Page title="Sticker Template Designer Studio" backAction={{ content: 'Templates', url: '/TemplateList' }}>
                <BlockStack gap="400">
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
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 7, lg: 7 }}>
                            <BlockStack gap="400">
                                {errorBanner && <Banner tone="critical"><p>{errorBanner}</p></Banner>}
                                <LineControls design={design} handleUpdate={handleUpdate} />
                                <SymbolControls design={design} handleUpdate={handleUpdate} />
                            </BlockStack>
                        </Grid.Cell>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 5, lg: 5 }}>
                            <BlockStack gap="400" style={{ position: 'sticky', top: '20px' }}>
                                <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbc3c9', borderRadius: '4px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '180px', justifyContent: 'center', textAlign: 'center' }}>
                                    {design.line1_sku && <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#1a1a1a', marginBottom: '2px' }}>{previewItem.sku}</div>}
                                    <Box display="flex" gap="100" flexWrap="wrap" justifyContent="center">
                                        {design.line2_name && <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{previewItem.title}</span>}
                                        {design.line2_variant_option1 && previewItem.option_1 && <span style={{ fontSize: '14px', color: '#6d7175' }}> — {previewItem.option_1}</span>}
                                        {design.line2_price && (
                                            <span
                                                style={{
                                                    fontSize: "15px",
                                                    fontWeight: "bold",
                                                    color: "#108043",
                                                }}
                                            >
                                                | {formatPrice(previewItem.price)}
                                            </span>
                                        )}
                                    </Box>

                                    {design.symbol_enabled && (
                                        <Box
                                            marginTop="300"
                                            display="flex"
                                            flexDirection="column"
                                            alignItems="center"
                                            style={{ width: "100%" }}
                                        >

                                            {/* Debug value */}
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "red",
                                                    marginBottom: "10px",
                                                    wordBreak: "break-all",
                                                }}
                                            >
                                                QR VALUE:
                                                <br />
                                                {getSymbolTargetValue()}
                                            </div>

                                            {design.symbol_type === "BARCODE" ? (
                                                <BarcodeRenderer
                                                    value={getSymbolTargetValue()}
                                                    settings={design}
                                                />
                                            ) : (
                                                <QrCodeRenderer
                                                    value={getSymbolTargetValue()}
                                                    settings={design}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </div>
                                <Card padding="300"><Box display="flex" gap="300" alignItems="center"><div style={{ flexGrow: 1 }}>
                                    <TextField
                                        type="number"
                                        label="Qty"
                                        value={String(design.print_qty || 1)}
                                        onChange={(value) =>
                                            handleUpdate(
                                                "print_qty",
                                                Math.max(1, parseInt(value) || 1)
                                            )
                                        }
                                        autoComplete="off"
                                    />
                                </div><Box paddingTop="400"><button style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', height: '36px' }} onClick={handleTestPrintDownload}>Test Print</button></Box></Box></Card>
                            </BlockStack>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
                {toastActive && <Toast content="Template parameters saved to store!" onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}

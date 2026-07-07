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
        if (design.symbol_field_source === 'product_name') return previewItem.title;
        if (design.symbol_field_source === 'product_price') return `$${previewItem.price}`;
        if (design.symbol_field_source === 'product_online_url') return previewItem.online_url || `https://${window.location.hostname}`;
        return previewItem.sku;
    }, [design.symbol_field_source, previewItem]);

    useEffect(() => {
        async function loadData() {
            try {
                const [tRes, pRes] = await Promise.all([fetch(`/api/templates/design/${id}`), fetch('/api/products')]);
                if (tRes.ok) { const r = await tRes.json(); if (r.success) setDesign(r.data); }
                if (pRes.ok) {
                    const r = await pRes.json();
                    if (r.status === 1 && r.variants?.length > 0) {
                        setStoreVariants(r.variants);
                        const firstItem = r.variants[0];
                        setSelectedVariantId(firstItem.variant_id);
                        setPreviewItem({ title: firstItem.product_title, sku: firstItem.current_sku || 'NO-SKU', price: firstItem.price, vendor: firstItem.vendor, option_1: firstItem.variant_title !== 'Default Title' ? firstItem.variant_title : '' });
                    }
                }
            } catch { setErrorBanner("Failed to communicate with template design configurations."); }
            finally { setPageLoading(false); }
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
                    body: JSON.stringify(design)
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
    }, [id, design, fetch]);

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
                    price: previewItem.price,
                    vendor: previewItem.vendor,
                    option_1: previewItem.option_1,
                    print_qty: parseInt(design.print_qty) || 1,
                    design,
                }),
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

    return (
        <Frame>
            <SaveBar id="designer-bar" open={isDirty}><button variant="primary" loading={loading ? "true" : undefined} onClick={handleSave}>Save Design</button><button onClick={() => setIsDirty(false)}>Discard</button></SaveBar>
            <Page title="Sticker Template Designer Studio" backAction={{ content: 'Templates', url: '/TemplateList' }}>
                <BlockStack gap="400">
                    <Card padding="400"><Select label="Preview Product Variant Context" options={storeVariants.map(v => ({ label: `${v.product_title} (${v.current_sku || 'No SKU'})`, value: v.variant_id }))} value={selectedVariantId} onChange={(id) => { setSelectedVariantId(id); const m = storeVariants.find(x => x.variant_id === id); if (m) setPreviewItem({ title: m.product_title, sku: m.current_sku || 'NO-SKU', price: m.price, vendor: m.vendor, option_1: m.variant_title !== 'Default Title' ? m.variant_title : '' }) }} /></Card>
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
                                        {design.line2_price && <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#108043' }}> | {design.line2_currency_format === '${{amount}}' ? `$${previewItem.price}` : previewItem.price}</span>}
                                    </Box>
                                    {design.line3_vendor && <div style={{ fontSize: '12px', color: '#6d7175', marginTop: '2px' }}>{previewItem.vendor}</div>}
                                    {design.symbol_enabled && <Box marginTop="300" display="flex" justifyContent="center" style={{ width: '100%' }}>{design.symbol_type === 'BARCODE' ? <BarcodeRenderer value={getSymbolTargetValue()} settings={design} /> : <QrCodeRenderer value={getSymbolTargetValue()} settings={design} />}</Box>}
                                </div>
                                <Card padding="300"><Box display="flex" gap="300" alignItems="center"><div style={{ flexGrow: 1 }}><TextField type="number" label="Qty" value={String(design.print_qty || 1)} onChange={(v) => handleUpdate('print_qty', parseInt(v) || 1)} autoComplete="off" /></div><Box paddingTop="400"><button style={{ backgroundColor: '#1a1a1a', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', height: '36px' }} onClick={handleTestPrintDownload}>Test Print</button></Box></Box></Card>
                            </BlockStack>
                        </Grid.Cell>
                    </Grid>
                </BlockStack>
                {toastActive && <Toast content="Template parameters saved to store!" onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}

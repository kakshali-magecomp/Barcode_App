import React, { useState, useCallback, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

import BarcodeSkuPanel from './BarcodeSkuPanel';
import SkuSettingsIndex from './SkuSettingsIndex.jsx';
import PrintPanel from './PrintPanel';

const SAVE_BAR_ID = 'app-save-bar';

export default function SettingsIndex() {
    const shopify = useAppBridge();

    const [selectedTab, setSelectedTab] = useState(0);
    const tabs = [
        { id: 'barcode', content: 'Barcode' },
        { id: 'sku', content: 'SKU Generation' },
        { id: 'printing-tab', content: 'Printing Configurations' },
    ];

    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    const [barcodeSettings, setBarcodeSettings] = useState({
        auto_generate_on_create: false,
        auto_detect_gtin_format: true,
        prevent_zero_start_end: false,
        barcode_format: 'CODE128',
        barcode_pattern: '',
        contextual_pricing_value: ''
    });

    const [skuSettings, setSkuSettings] = useState({
        sku_prefix: '',
        sku_auto_number_start: '1001',
        sku_suffix: '',
        sku_delimiter: '-',
        segment_product_title: 'none',
        segment_product_vendor: 'none',
        segment_product_type: 'none',
        segment_option1: 'none',
        segment_option2: 'none',
        segment_option3: 'none',
        segment_metafields: 'none',
        hide_options_1_2_3: false,
        force_uppercase_fields: true
    });

    const [printSettings, setPrintSettings] = useState({
        print_mode: 'dialog',
        rotate_180: false,
        label_width: 32,
        label_height: 19,
        margin_top: 0,
        margin_left: 0,
        price_decimal_number: 2,
        currency_format: 'without_currency',
        default_print_template_id: null,
        default_generate_option: 'manual',
        default_print_label_quantity: 1,
        vat_percentage: 0.00,
        sort_by_sku: false,
        hide_product_draft: false,
        hide_product_archived: false,
        use_shopify_flow_action: false
    });

    const [dbTemplates, setDbTemplates] = useState([]);


    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);


    const loadAllSettings = useCallback(async () => {
        try {
            setErrorBanner(null);
            const [barcodeRes, skuRes, printRes] = await Promise.all([
                fetch('/api/barcode-settings'),
                fetch('/api/sku-settings'),
                fetch('/api/print-settings')
            ]);

            if (barcodeRes.ok) {
                const bData = await barcodeRes.json();
                setBarcodeSettings(prev => ({ ...prev, ...bData }));
            }
            if (skuRes.ok) {
                const sData = await skuRes.json();
                setSkuSettings(prev => ({ ...prev, ...sData }));
            }
            if (printRes.ok) {
                const jsonResult = await printRes.json();
                if (jsonResult.success) {
                    setPrintSettings(prev => ({ ...prev, ...jsonResult.settings }));
                    setDbTemplates(jsonResult.templates || []);
                }
            }
            setIsDirty(false);
        } catch (err) {
            setErrorBanner("Could not sync backend application config records.");
        }
    }, []);

    useEffect(() => {
        loadAllSettings();
    }, [loadAllSettings]);

    const handleSettingChange = (key, value) => {
        setIsDirty(true);

        if (selectedTab === 0) {
            setBarcodeSettings(prev => ({ ...prev, [key]: value }));
        } else if (selectedTab === 1) {
            setSkuSettings(prev => ({ ...prev, [key]: value }));
        } else if (selectedTab === 2) {
            setPrintSettings(prev => ({ ...prev, [key]: value }));
        }
    };

    const handleSave = useCallback(async () => {
        setLoading(true);
        setErrorBanner(null);

        let targetUrl = '/api/barcode-settings';
        let payload = barcodeSettings;

        if (selectedTab === 1) {
            targetUrl = '/api/sku-settings';
            payload = skuSettings;
        } else if (selectedTab === 2) {
            targetUrl = '/api/print-settings';
            payload = printSettings;
        }

        try {
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {

                shopify.toast.show("Settings profile updated successfully!");
                setIsDirty(false);
            } else {

                let message = "Failed to save changes profile settings configuration.";
                try {
                    const errJson = await res.json();
                    if (errJson?.message) message = errJson.message;
                    else if (errJson?.errors) message = Object.values(errJson.errors).flat().join(' ');
                } catch { /* response wasn't JSON, keep the generic message */ }
                setErrorBanner(message);
            }
        } catch (err) {
            setErrorBanner("Network transmission tracking error encountered.");
        } finally {
            setLoading(false);
        }
    }, [selectedTab, barcodeSettings, skuSettings, printSettings, shopify]);

    const handleDiscard = useCallback(async () => {
        setIsDirty(false);
        await loadAllSettings();
    }, [loadAllSettings]);

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button variant="primary" loading={loading ? "" : undefined} onClick={handleSave}>Save</button>
                <button onClick={handleDiscard}>Discard</button>
            </ui-save-bar>
            <s-page heading="App Settings">
                <s-section padding="none">
                    <div
                        style={{
                            height: "48px",
                            borderBottom: "1px solid #e1e3e5",
                            backgroundColor: "#ffffff",
                            padding: "0 20px",
                        }}
                    >
                        <div
                            style={{
                                height: "100%",
                                display: "flex",
                                alignItems: "stretch",
                                justifyContent: "flex-start",
                                gap: "28px",
                            }}
                        >
                            {tabs.map((tab, index) => {
                                const active = selectedTab === index;

                                return (
                                    <div
                                        key={tab.id}
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => {
                                            setSelectedTab(index);
                                            setIsDirty(false);
                                        }}
                                        style={{
                                            position: "relative",
                                            height: "48px",
                                            display: "flex",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            color: active
                                                ? "#202223"
                                                : "#6d7175",
                                            fontSize: "14px",
                                            fontWeight: active ? 600 : 500,
                                            whiteSpace: "nowrap",
                                            padding: "0 2px",
                                        }}
                                    >
                                        {tab.content}

                                        {active && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: "-1px",
                                                    left: 0,
                                                    right: 0,
                                                    height: "2px",
                                                    backgroundColor: "#008060",
                                                    borderRadius: "2px 2px 0 0",
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </s-section>


                {errorBanner && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            {errorBanner}
                        </s-banner>
                    </s-section>
                )}


                {selectedTab === 0 && (
                    <BarcodeSkuPanel settings={barcodeSettings} onChange={handleSettingChange} />
                )}

                {selectedTab === 1 && (
                    <SkuSettingsIndex settings={skuSettings} onChange={handleSettingChange} />
                )}

                {selectedTab === 2 && (
                    <PrintPanel settings={printSettings} templates={dbTemplates} onChange={handleSettingChange} />
                )}
            </s-page>
        </>
    );
}
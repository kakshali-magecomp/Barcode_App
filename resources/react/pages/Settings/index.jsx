import React, { useState, useCallback, useEffect } from 'react';
import { Page, Tabs, ContextualSaveBar, Frame, Toast, Banner } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import BarcodeSkuPanel from './BarcodeSkuPanel';
import SkuSettingsIndex from './SkuSettingsIndex.jsx'; 

export default function SettingsIndex() {
    const appBridge = useAppBridge();
    const fetch = window.fetch; 

    // Dynamic Tab Navigation System - Updated with 4 distinct tab options
    const [selectedTab, setSelectedTab] = useState(0);
    const tabs = [
        { id: 'barcode', content: 'Barcode', panelID: 'barcode-panel' },
        { id: 'sku', content: 'SKU Generation', panelID: 'sku-panel' }, // ADDED: Restores alignment with tab index 1
        { id: 'printing-tab', content: 'Printing Configurations', panelID: 'printing-panel' }, 
        { id: 'advanced-tab', content: 'Advanced Options', panelID: 'advanced-panel' }     
    ];

    // State 1: Consolidated State Object (Barcode fields)
    const [barcodeSettings, setBarcodeSettings] = useState({
        auto_generate_on_create: false,
        auto_detect_gtin_format: true,
        prevent_zero_start_end: false,
        barcode_format: 'CODE128',
        barcode_pattern: '',
        contextual_pricing_value: ''
    });

    // State 2: Consolidated State Object (SKU fields)
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

    // Page State Trackers
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    // Pull settings records from both controllers concurrently on mount
    useEffect(() => {
        async function loadAllSettings() {
            try {
                const [barcodeRes, skuRes] = await Promise.all([
                    fetch('/api/barcode-settings'),
                    fetch('/api/sku-settings')
                ]);

                if (barcodeRes.ok) {
                    const bData = await barcodeRes.json();
                    setBarcodeSettings(prev => ({ ...prev, ...bData }));
                }
                if (skuRes.ok) {
                    const sData = await skuRes.json();
                    setSkuSettings(prev => ({ ...prev, ...sData }));
                }
            } catch (err) {
                setErrorBanner("Could not sync backend application config records.");
            }
        }
        loadAllSettings();
    }, [fetch]);

    // Handle variable shifts based on which tab panel layout is currently visible
    const handleSettingChange = (key, value) => {
        setIsDirty(true);
        if (selectedTab === 0) {
            setBarcodeSettings(prev => ({ ...prev, [key]: value }));
        } else if (selectedTab === 1) {
            setSkuSettings(prev => ({ ...prev, [key]: value }));
        }
    };

    // Unified dynamic save engine targeting separate endpoints cleanly
    const handleSave = useCallback(async () => {
        setLoading(true);
        setErrorBanner(null);

        // Dynamically choose target routing and matching payload
        const targetUrl = selectedTab === 0 ? '/api/barcode-settings' : '/api/sku-settings';
        const payload = selectedTab === 0 ? barcodeSettings : skuSettings;

        try {
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                setToastActive(true);
                setIsDirty(false); // Clear dirty tracking to hide the ContextualSaveBar
            } else {
                setErrorBanner("Failed to save changes profile settings configuration.");
            }
        } catch (err) {
            setErrorBanner("Network transmission tracking error encountered.");
        } finally {
            setLoading(false);
        }
    }, [selectedTab, barcodeSettings, skuSettings, fetch]);

    return (
        <Frame>
            {/* Native Top-floating Save Bar component triggered when inputs change */}
            {isDirty && (
                <ContextualSaveBar
                    message="Unsaved configuration changes"
                    saveAction={{ loading, onAction: handleSave }}
                    discardAction={{ onAction: () => setIsDirty(false) }}
                />
            )}
            
            <Page title="App Settings">
                {/* Reset page tracking metrics when tabs are changed */}
                <Tabs tabs={tabs} selected={selectedTab} onSelect={(index) => { setSelectedTab(index); setIsDirty(false); }}>
                    <div style={{ marginTop: '20px' }}>
                        {errorBanner && (
                            <Banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                                <p>{errorBanner}</p>
                            </Banner>
                        )}
                        
                        {/* Tab 0: Isolated Barcode Content Layout */}
                        {selectedTab === 0 && (
                            <BarcodeSkuPanel settings={barcodeSettings} onChange={handleSettingChange} />
                        )}

                        {/* Tab 1: Isolated SKU Generation Rules Form Layout */}
                        {selectedTab === 1 && (
                            <SkuSettingsIndex settings={SkuSettingsIndex} onChange={handleSettingChange} />
                        )}

                        {/* Tab 2: Printing Layout Configuration Space */}
                        {selectedTab === 2 && (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <h3>Printing Configurations Panel Content (Coming Soon)</h3>
                            </div>
                        )}

                        {/* Tab 3: Advanced Custom Rules Configuration Space */}
                        {selectedTab === 3 && (
                            <div style={{ padding: '20px', textAlign: 'center' }}>
                                <h3>Advanced Rules Customizations Layout (Coming Soon)</h3>
                            </div>
                        )}
                    </div>
                </Tabs>
                {toastActive && <Toast content="Settings profile updated successfully!" onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}

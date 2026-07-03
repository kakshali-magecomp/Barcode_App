import React, { useState, useCallback, useEffect } from 'react';
import { Page, Tabs, Frame, Toast, Banner } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { SaveBar } from '@shopify/app-bridge-react';


import BarcodeSkuPanel from './BarcodeSkuPanel';
import SkuSettingsIndex from './SkuSettingsIndex.jsx'; 
import PrintPanel from './PrintPanel'; 

export default function SettingsIndex() {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch; 

    const [selectedTab, setSelectedTab] = useState(0);
    const tabs = [
        { id: 'barcode', content: 'Barcode', panelID: 'barcode-panel' },
        { id: 'sku', content: 'SKU Generation', panelID: 'sku-panel' }, 
        { id: 'printing-tab', content: 'Printing Configurations', panelID: 'printing-panel' }, 
    ];

    // Form Tracking States
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    // Barcode Parameters State
    const [barcodeSettings, setBarcodeSettings] = useState({
        auto_generate_on_create: false,
        auto_detect_gtin_format: true,
        prevent_zero_start_end: false,
        barcode_format: 'CODE128',
        barcode_pattern: '',
        contextual_pricing_value: ''
    });

    // SKU Parameters State
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

    // Print Parameters State
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

    // Fetch initial database records on mount
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
            setIsDirty(false); // Clear baseline dirty flag state mapping references
        } catch (err) {
            setErrorBanner("Could not sync backend application config records.");
        }
    }, [fetch]);

    useEffect(() => {
        loadAllSettings();
    }, [loadAllSettings]);

       


    // Handle incoming input edits and trigger dirty status instantly
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
                setToastActive(true);
                setIsDirty(false); // Successfully clears dirty state to hide the Save Bar smoothly
            } else {
                setErrorBanner("Failed to save changes profile settings configuration.");
            }
        } catch (err) {
            setErrorBanner("Network transmission tracking error encountered.");
        } finally {
            setLoading(false);
        }
    }, [selectedTab, barcodeSettings, skuSettings, printSettings, fetch]);

    const handleDiscard = useCallback(async () => {
        setIsDirty(false);
        await loadAllSettings();
    }, [loadAllSettings]);

    return (
        <Frame>
            {/*  MOUNT THE COMPONENT DIRECTLY. Shopify opens it automatically whenever isDirty={true} */}
            <SaveBar id="app-save-bar" open={isDirty}>
                <button variant="primary" loading={loading ? "true" : undefined} onClick={handleSave}>Save</button>
                <button onClick={handleDiscard}>Discard</button>
            </SaveBar>

            <Page title="App Settings">
                <Tabs 
                    tabs={tabs} 
                    selected={selectedTab} 
                    onSelect={(index) => { 
                        setSelectedTab(index); 
                        setIsDirty(false); // Resets smoothly when swapping tabs panel space views
                    }}
                >
                    <div style={{ marginTop: '20px' }}>
                        {errorBanner && (
                            <Banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                                <p>{errorBanner}</p>
                            </Banner>
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
                    </div>
                </Tabs>
                {toastActive && <Toast content="Settings profile updated successfully!" onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}

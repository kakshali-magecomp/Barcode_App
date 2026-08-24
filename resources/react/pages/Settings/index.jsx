import React, { useState, useCallback, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

import BarcodeSkuPanel from './BarcodeSkuPanel';
import SkuSettingsIndex from './SkuSettingsIndex.jsx';
import PrintPanel from './PrintPanel';

const BARCODE_SAVE_BAR_ID = 'barcode-save-bar';
const SKU_SAVE_BAR_ID = 'sku-save-bar';
const PRINT_SAVE_BAR_ID = 'print-save-bar';

export default function SettingsIndex() {
    const shopify = useAppBridge();
    const [selectedTab, setSelectedTab] = useState(0);
    const tabs = [
        { id: 'barcode', content: 'Barcode' },
        { id: 'sku', content: 'SKU Generation' },
        { id: 'printing-tab', content: 'Printing Configurations' },
    ];

    const [barcodeDirty, setBarcodeDirty] = useState(false);
    const [skuDirty, setSkuDirty] = useState(false);
    const [printDirty, setPrintDirty] = useState(false);
    const [savedBarcodeSettings, setSavedBarcodeSettings] = useState(null);
    const [savedSkuSettings, setSavedSkuSettings] = useState(null);
    const [savedPrintSettings, setSavedPrintSettings] = useState(null);
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
        segment_metafield: '',
        segment_metafield_rule: 'full',
        hide_options_1_2_3: false,
        force_uppercase_fields: true,
        auto_generate_on_create: false
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
    const getSaveBarId = useCallback((tabIndex) => {
        if (tabIndex === 0) return BARCODE_SAVE_BAR_ID;
        if (tabIndex === 1) return SKU_SAVE_BAR_ID;
        return PRINT_SAVE_BAR_ID;
    }, []);
    const areSettingsEqual = useCallback((first, second) => {
        return JSON.stringify(first) === JSON.stringify(second);
    }, []);

    const isTabDirty = useCallback((tabIndex) => {
        if (tabIndex === 0) return barcodeDirty;
        if (tabIndex === 1) return skuDirty;
        return printDirty;
    }, [barcodeDirty, skuDirty, printDirty]);

    useEffect(() => {
        const syncSaveBar = async () => {
            await shopify.saveBar.hide(BARCODE_SAVE_BAR_ID);
            await shopify.saveBar.hide(SKU_SAVE_BAR_ID);
            await shopify.saveBar.hide(PRINT_SAVE_BAR_ID);

            if (isTabDirty(selectedTab)) {
                await shopify.saveBar.show(getSaveBarId(selectedTab));
            }
        };

        syncSaveBar();
    }, [selectedTab, barcodeDirty, skuDirty, printDirty, isTabDirty, getSaveBarId, shopify]);

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
                const barcodeData =
                    bData.success && bData.settings
                        ? bData.settings
                        : bData;

                setBarcodeSettings(prev => {
                    const updated = {
                        ...prev,
                        ...barcodeData
                    };

                    setSavedBarcodeSettings(updated);
                    return updated;
                });
            }

            if (skuRes.ok) {
                const sData = await skuRes.json();
                setSkuSettings(prev => {
                    const updated = {
                        ...prev,
                        ...sData
                    };

                    setSavedSkuSettings(updated);
                    return updated;
                });
            }

            if (printRes.ok) {
                const jsonResult = await printRes.json();
                if (jsonResult.success) {
                    setPrintSettings(prev => {
                        const updated = {
                            ...prev,
                            ...jsonResult.settings
                        };
                        setSavedPrintSettings(updated);
                        return updated;
                    });
                    setDbTemplates(jsonResult.templates || []);
                }
            }

            setBarcodeDirty(false);
            setSkuDirty(false);
            setPrintDirty(false);

        } catch (err) {
            setErrorBanner(
                "Could not sync backend application config records."
            );
        }
    }, []);

    useEffect(() => {
        loadAllSettings();
    }, [loadAllSettings]);

    const handleSettingChange = useCallback((key, value) => {
        if (selectedTab === 0) {
            setBarcodeSettings(prev => {
                const updated = {
                    ...prev,
                    [key]: value
                };
                setBarcodeDirty(
                    !areSettingsEqual(updated, savedBarcodeSettings)
                );
                return updated;
            });
        }

        if (selectedTab === 1) {
            setSkuSettings(prev => {
                const updated = {
                    ...prev,
                    [key]: value
                };
                setSkuDirty(
                    !areSettingsEqual(updated, savedSkuSettings)
                );
                return updated;
            });
        }

        if (selectedTab === 2) {
            setPrintSettings(prev => {
                const updated = {
                    ...prev,
                    [key]: value
                };
                setPrintDirty(
                    !areSettingsEqual(updated, savedPrintSettings)
                );
                return updated;
            });
        }
    }, [ selectedTab, savedBarcodeSettings, savedSkuSettings, savedPrintSettings, areSettingsEqual]);

    const handleSave = useCallback(async () => {
        setLoading(true);
        setErrorBanner(null);

        let targetUrl = '';
        let payload = null;
        let saveBarId = '';

        if (selectedTab === 0) {
            targetUrl = '/api/barcode-settings';
            payload = barcodeSettings;
            saveBarId = BARCODE_SAVE_BAR_ID;
        }

        if (selectedTab === 1) {
            targetUrl = '/api/sku-settings';
            payload = skuSettings;
            saveBarId = SKU_SAVE_BAR_ID;
        }

        if (selectedTab === 2) {
            targetUrl = '/api/print-settings';
            payload = printSettings;
            saveBarId = PRINT_SAVE_BAR_ID;
        }

        try {
            const res = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (selectedTab === 0) {
                    setSavedBarcodeSettings(barcodeSettings);
                    setBarcodeDirty(false);
                    await shopify.saveBar.hide(BARCODE_SAVE_BAR_ID);
                }

                if (selectedTab === 1) {
                    setSavedSkuSettings(skuSettings);
                    setSkuDirty(false);
                    await shopify.saveBar.hide(SKU_SAVE_BAR_ID);
                }

                if (selectedTab === 2) {
                    setSavedPrintSettings(printSettings);
                    setPrintDirty(false);
                    await shopify.saveBar.hide(PRINT_SAVE_BAR_ID);
                }

                shopify.toast.show(
                    "Settings profile updated successfully!"
                );
            } else {
                let message =
                    "Failed to save changes profile settings configuration.";

                try {
                    const errJson = await res.json();

                    if (errJson?.message) {
                        message = errJson.message;
                    } else if (errJson?.errors) {
                        message = Object.values(errJson.errors)
                            .flat()
                            .join(' ');
                    }
                } catch { }

                setErrorBanner(message);
            }

        } catch (err) {
            setErrorBanner(
                "Network transmission tracking error encountered."
            );
        } finally {
            setLoading(false);
        }
    }, [ selectedTab, barcodeSettings, skuSettings, printSettings, shopify]);

    const handleDiscard = useCallback(async () => {
        const saveBarId = getSaveBarId(selectedTab);

        await shopify.saveBar.hide(saveBarId);

        if (selectedTab === 0) {
            setBarcodeSettings(savedBarcodeSettings);
            setBarcodeDirty(false);
        }

        if (selectedTab === 1) {
            setSkuSettings(savedSkuSettings);
            setSkuDirty(false);
        }

        if (selectedTab === 2) {
            setPrintSettings(savedPrintSettings);
            setPrintDirty(false);
        }
    }, [ selectedTab, getSaveBarId, shopify, savedBarcodeSettings, savedSkuSettings, savedPrintSettings]);

    const handleTabChange = useCallback(async (index) => {
        if (index === selectedTab) {
            return;
        }

        if (isTabDirty(selectedTab)) {
            const confirmed = await shopify.saveBar.leaveConfirmation();
            if (!confirmed) {
                return;
            }
            const currentSaveBarId = getSaveBarId(selectedTab);
            await shopify.saveBar.hide(currentSaveBarId);
            if (selectedTab === 0) {
                setBarcodeDirty(false);
            }

            if (selectedTab === 1) {
                setSkuDirty(false);
            }

            if (selectedTab === 2) {
                setPrintDirty(false);
            }
        }

        setSelectedTab(index);
    }, [ selectedTab, isTabDirty, getSaveBarId, shopify]);

    return (
        <>
            <ui-save-bar id={BARCODE_SAVE_BAR_ID}>
                <button
                    variant="primary"
                    loading={selectedTab === 0 && loading ? "" : undefined}
                    disabled={selectedTab === 0 && loading}
                    onClick={handleSave}
                >
                    Save
                </button>

                <button
                    disabled={selectedTab === 0 && loading}
                    onClick={handleDiscard}
                >
                    Discard
                </button>
            </ui-save-bar>

            <ui-save-bar id={SKU_SAVE_BAR_ID}>
                <button
                    variant="primary"
                    loading={selectedTab === 1 && loading ? "" : undefined}
                    disabled={selectedTab === 1 && loading}
                    onClick={handleSave}
                >
                    Save
                </button>

                <button
                    disabled={selectedTab === 1 && loading}
                    onClick={handleDiscard}
                >
                    Discard
                </button>
            </ui-save-bar>

            <ui-save-bar id={PRINT_SAVE_BAR_ID}>
                <button
                    variant="primary"
                    loading={selectedTab === 2 && loading ? "" : undefined}
                    disabled={selectedTab === 2 && loading}
                    onClick={handleSave}
                >
                    Save
                </button>

                <button
                    disabled={selectedTab === 2 && loading}
                    onClick={handleDiscard}
                >
                    Discard
                </button>
            </ui-save-bar>

            <s-page heading="App Settings">
                    <div style={{ height: "48px", borderBottom: "1px solid #e1e3e5", padding: "0 20px",}}>
                        <div style={{ height: "100%", display: "flex", alignItems: "stretch", justifyContent: "flex-start", gap: "28px",}}>
                            {tabs.map((tab, index) => {
                                const active = selectedTab === index;

                                return (
                                    <div
                                        key={tab.id}
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() =>
                                            handleTabChange(index)
                                        }
                                        style={{ position: "relative", height: "48px", display: "flex", alignItems: "center",
                                            cursor:
                                                active
                                                    ? "default"
                                                    : "pointer",
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
                                                style={{  position: "absolute", bottom: "-1px", left: 0, right: 0,  height: "2px", backgroundColor: "#008060", borderRadius: "1px 1px 0 0",
                                                }}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                <s-box paddingBlockStart="base" />
                {errorBanner && (
                    <s-section>
                        <s-banner
                            tone="critical"
                            onDismiss={() => setErrorBanner(null)}
                        >
                            {errorBanner}
                        </s-banner>
                    </s-section>
                )}

                {selectedTab === 0 && (
                    <BarcodeSkuPanel
                        settings={barcodeSettings}
                        onChange={handleSettingChange}
                    />
                )}

                {selectedTab === 1 && (
                    <SkuSettingsIndex
                        settings={skuSettings}
                        onChange={handleSettingChange}
                    />
                )}

                {selectedTab === 2 && (
                    <PrintPanel
                        settings={printSettings}
                        templates={dbTemplates}
                        onChange={handleSettingChange}                  
                    />
                )}
            </s-page>
        </>
    );
}
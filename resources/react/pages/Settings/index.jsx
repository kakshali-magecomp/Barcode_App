import React, { useState, useCallback, useEffect } from 'react';
import { useAppBridge, TitleBar } from '@shopify/app-bridge-react';

import BarcodeSkuPanel from './BarcodeSkuPanel';
import SkuSettingsIndex from './SkuSettingsIndex.jsx';
import PrintPanel from './PrintPanel';

const BARCODE_SAVE_BAR_ID = 'barcode-save-bar';
const SKU_SAVE_BAR_ID = 'sku-save-bar';
const PRINT_SAVE_BAR_ID = 'print-save-bar';

export default function SettingsIndex() {
    const shopify = useAppBridge();
    const [selectedTab, setSelectedTab] = useState(0);

    const [storeDomain, setStoreDomain] = useState('kakshalijani.myshopify.com');
    const [adminEmail, setAdminEmail] = useState('magecomp.shopifyteam@gmail.com');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shop = params.get('shop');
        if (shop) {
            setStoreDomain(shop);
        }
    }, []);

    const navItems = [
        {
            id: 'barcode',
            title: 'Barcode Configuration',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14" />
                </svg>
            )
        },
        {
            id: 'sku',
            title: 'SKU Generation',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                </svg>
            )
        },
        {
            id: 'printing-tab',
            title: 'Printing Configurations',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                </svg>
            )
        },
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
                const barcodeData = bData.success && bData.settings ? bData.settings : bData;

                setBarcodeSettings(prev => {
                    const updated = { ...prev, ...barcodeData };
                    setSavedBarcodeSettings(updated);
                    return updated;
                });
            }

            if (skuRes.ok) {
                const sData = await skuRes.json();
                setSkuSettings(prev => {
                    const updated = { ...prev, ...sData };
                    setSavedSkuSettings(updated);
                    return updated;
                });
            }

            if (printRes.ok) {
                const jsonResult = await printRes.json();
                if (jsonResult.success) {
                    setPrintSettings(prev => {
                        const updated = { ...prev, ...jsonResult.settings };
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
            setErrorBanner("Could not sync backend application config records.");
        }
    }, []);

    useEffect(() => {
        loadAllSettings();
    }, [loadAllSettings]);

    const handleSettingChange = useCallback((key, value) => {
        if (selectedTab === 0) {
            setBarcodeSettings(prev => {
                const updated = { ...prev, [key]: value };
                setBarcodeDirty(!areSettingsEqual(updated, savedBarcodeSettings));
                return updated;
            });
        }

        if (selectedTab === 1) {
            setSkuSettings(prev => {
                const updated = { ...prev, [key]: value };
                setSkuDirty(!areSettingsEqual(updated, savedSkuSettings));
                return updated;
            });
        }

        if (selectedTab === 2) {
            setPrintSettings(prev => {
                const updated = { ...prev, [key]: value };
                setPrintDirty(!areSettingsEqual(updated, savedPrintSettings));
                return updated;
            });
        }
    }, [selectedTab, savedBarcodeSettings, savedSkuSettings, savedPrintSettings, areSettingsEqual]);

    const handleSave = useCallback(async () => {
        setLoading(true);
        setErrorBanner(null);

        let targetUrl = '';
        let payload = null;

        if (selectedTab === 0) {
            targetUrl = '/api/barcode-settings';
            payload = barcodeSettings;
        }

        if (selectedTab === 1) {
            targetUrl = '/api/sku-settings';
            payload = skuSettings;
        }

        if (selectedTab === 2) {
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

                shopify.toast.show("Settings profile updated successfully!");
            } else {
                let message = "Failed to save changes profile settings configuration.";
                try {
                    const errJson = await res.json();
                    if (errJson?.message) {
                        message = errJson.message;
                    } else if (errJson?.errors) {
                        message = Object.values(errJson.errors).flat().join(' ');
                    }
                } catch { }
                setErrorBanner(message);
            }

        } catch (err) {
            setErrorBanner("Network transmission tracking error encountered.");
        } finally {
            setLoading(false);
        }
    }, [selectedTab, barcodeSettings, skuSettings, printSettings, shopify]);

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
    }, [selectedTab, getSaveBarId, shopify, savedBarcodeSettings, savedSkuSettings, savedPrintSettings]);

    const handleTabChange = useCallback(async (index) => {
        if (index === selectedTab) return;

        if (isTabDirty(selectedTab)) {
            const confirmed = await shopify.saveBar.leaveConfirmation();
            if (!confirmed) return;
            const currentSaveBarId = getSaveBarId(selectedTab);
            await shopify.saveBar.hide(currentSaveBarId);
            if (selectedTab === 0) setBarcodeDirty(false);
            if (selectedTab === 1) setSkuDirty(false);
            if (selectedTab === 2) setPrintDirty(false);
        }

        setSelectedTab(index);
    }, [selectedTab, isTabDirty, getSaveBarId, shopify]);

    const storeInitial = storeDomain.charAt(0).toUpperCase() || 'K';

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
                <TitleBar title="barcodedemo-app" />

                {errorBanner && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            {errorBanner}
                        </s-banner>
                    </s-section>
                )}

                {/* NATURAL CLEAN SETTINGS LAYOUT (MATCHING PRINT SETTINGS UX) */}
                <div
                    style={{
                        display: "flex",
                        gap: "24px",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "4px 0 40px 0",
                    }}
                >
                    {/* LEFT SIDEBAR COLUMN (STORE CARD & VERTICAL NAV MENU - STICKY) */}
                    <div
                        style={{
                            flex: "0 0 310px",
                            maxWidth: "100%",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            boxSizing: "border-box",
                            position: "sticky",
                            top: "16px",
                            zIndex: 5,
                            marginBottom: "24px",
                        }}
                    >
                        {/* Top Card: Store Account Badge (Compact Design matching reference) */}
                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e1e3e5",
                                borderRadius: "12px",
                                padding: "10px 14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                            }}
                        >
                            {/* Avatar Badge with Store Initial */}
                            <div
                                style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.2)",
                                }}
                            >
                                {storeInitial}
                            </div>

                            <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: "13px",
                                        color: "#1a1a1a",
                                        lineHeight: 1.25,
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                    }}
                                    title={storeDomain}
                                >
                                    {storeDomain}
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#6d7175",
                                        marginTop: "2px",
                                        lineHeight: 1.25,
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                    }}
                                    title={adminEmail}
                                >
                                    {adminEmail}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Card: Vertical Settings Menu */}
                        <div
                            style={{
                                background: "#ffffff",
                                border: "1px solid #e1e3e5",
                                borderRadius: "14px",
                                padding: "12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                            }}
                        >
                            {navItems.map((item, index) => {
                                const active = selectedTab === index;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleTabChange(index)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "12px 16px",
                                            borderRadius: "10px",
                                            cursor: "pointer",
                                            background: active ? "#e9ecef" : "transparent",
                                            color: active ? "#1a1a1a" : "#4b5563",
                                            fontWeight: active ? 700 : 500,
                                            fontSize: "14px",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: active ? "#1a1a1a" : "#6b7280",
                                            }}
                                        >
                                            {item.icon}
                                        </span>
                                        <span>{item.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT CONTENT COLUMN (MAIN SETTINGS FORM PANEL CARD - NATURAL FULL HEIGHT, CLEAN UX) */}
                    <div
                        style={{
                            flex: "1 1 500px",
                            minWidth: "0",
                            background: "#ffffff",
                            border: "1px solid #e1e3e5",
                            borderRadius: "14px",
                            padding: "28px 32px 36px 32px",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                            boxSizing: "border-box",
                            marginBottom: "40px",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "18px",
                                fontWeight: 700,
                                color: "#1a1a1a",
                                marginBottom: "20px",
                                paddingBottom: "14px",
                                borderBottom: "1px solid #f0f0f0",
                            }}
                        >
                            {navItems[selectedTab].title}
                        </div>

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
                    </div>
                </div>
            </s-page>
        </>
    );
}
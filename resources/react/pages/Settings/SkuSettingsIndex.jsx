import React, { useState, useCallback, useEffect } from 'react';
import { Page, Layout, Card, FormLayout, TextField, Select, Checkbox, BlockStack, Frame, Toast, Banner, Box, Text } from '@shopify/polaris';
import { useAppBridge, SaveBar } from '@shopify/app-bridge-react';

export default function SkuSettingsIndex() {
    const appBridge = useAppBridge();
    // CRUCIAL: Enforce App Bridge authenticated client fetch to authorize session transmissions
    const fetch = appBridge.fetch || window.fetch;

    // Isolated State Engine mapping to SKU database columns
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
        force_uppercase_fields: true
    });

    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [metafieldOptions, setMetafieldOptions] = useState([]);
    const loadMetafields = useCallback(async () => {
        try {
            const response = await fetch("/api/products");
            const json = await response.json();

            const used = new Set();
            const options = [];

            (json.variants || []).forEach((product) => {
                Object.keys(product.metafields || {}).forEach((key) => {
                    if (!used.has(key)) {
                        used.add(key);

                        options.push({
                            label: key,
                            value: key,
                        });
                    }
                });
            });

            setMetafieldOptions(options);
        } catch (error) {
            console.error(error);
        }
    }, [fetch]);
    const [toastActive, setToastActive] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    const positionOptions = [
        { label: 'Choose an option', value: 'none' },
        { label: 'Not used', value: 'disabled' },
        { label: 'First character', value: 'char_1' },
        { label: 'First 2 characters', value: 'char_2' },
        { label: 'First 3 characters', value: 'char_3' },
        { label: 'First 4 characters', value: 'char_4' },
        { label: 'Full value', value: 'full' }
    ];

    // Real-Time Generated SKU Output Preview Engine
    const generateSkuPreview = () => {
        const delimiter = skuSettings.sku_delimiter || '-';
        let segments = [];

        if (skuSettings.sku_prefix) segments.push(skuSettings.sku_prefix);

        const extractSubstring = (text, rule) => {
            if (!rule || rule === 'none' || rule === 'disabled') return null;
            if (rule === 'full') return text;
            if (rule === 'char_1') return text.substring(0, 1);
            if (rule === 'char_2') return text.substring(0, 2);
            if (rule === 'char_3') return text.substring(0, 3);
            if (rule === 'char_4') return text.substring(0, 4);
            return null;
        };

        const mockProduct = {
            title: 'Product Name Example',
            vendor: 'Example Vendor',
            type: 'Example Type',
            metafields: {
                "shopify.allergen-information": "Milk",
                "shopify.food-product-form": "Liquid",
                "custom.dietary_flags": "VEGAN",
                "custom.tasting_notes": "CREAMY",
                "shopify.flavor": "MANGO"
            },
            option1: 'example_option1',
            option2: 'example_option2',
            option3: 'example_option3',

        };

        const titlePart = extractSubstring(mockProduct.title, skuSettings.segment_product_title);
        if (titlePart) segments.push(titlePart);

        const vendorPart = extractSubstring(mockProduct.vendor, skuSettings.segment_product_vendor);
        if (vendorPart) segments.push(vendorPart);

        const typePart = extractSubstring(mockProduct.type, skuSettings.segment_product_type);
        if (typePart) segments.push(typePart);

        const metafieldValue =
            mockProduct.metafields[skuSettings.segment_metafield] || "";
        const metafieldPart = extractSubstring(
            metafieldValue,
            skuSettings.segment_metafield_rule
        );

        if (metafieldPart) {
            segments.push(metafieldPart);
        }

        if (!skuSettings.hide_options_1_2_3) {
            const opt1Part = extractSubstring(mockProduct.option1, skuSettings.segment_option1);
            const opt2Part = extractSubstring(mockProduct.option2, skuSettings.segment_option2);
            const opt3Part = extractSubstring(mockProduct.option3, skuSettings.segment_option3);
            if (opt1Part) segments.push(opt1Part);
            if (opt2Part) segments.push(opt2Part);
            if (opt3Part) segments.push(opt3Part);
        }

        segments.push(skuSettings.sku_auto_number_start || '1001');

        if (skuSettings.sku_suffix) segments.push(skuSettings.sku_suffix);

        let finalPreview = segments.join(delimiter).replace(/\s+/g, '');
        return skuSettings.force_uppercase_fields ? finalPreview.toUpperCase() : finalPreview;
    };

    // Fetch values on mount
    const loadSkuSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/sku-settings');
            if (res.ok) {
                const data = await res.json();
                setSkuSettings({
                    sku_prefix: data.sku_prefix || '',
                    sku_auto_number_start: data.sku_auto_number_start || '1001',
                    sku_suffix: data.sku_suffix || '',
                    sku_delimiter: data.sku_delimiter || '-',
                    segment_product_title: data.segment_product_title || 'none',
                    segment_product_vendor: data.segment_product_vendor || 'none',
                    segment_product_type: data.segment_product_type || 'none',
                    segment_metafield: data.segment_metafield || "",
                    segment_metafield_rule: data.segment_metafield_rule || "full",
                    segment_option1: data.segment_option1 || 'none',
                    segment_option2: data.segment_option2 || 'none',
                    segment_option3: data.segment_option3 || 'none',
                    hide_options_1_2_3: !!data.hide_options_1_2_3,
                    force_uppercase_fields: !!data.force_uppercase_fields
                });
                setIsDirty(false); // Clean on initial sync complete
            }
        } catch (err) {
            setErrorBanner("Could not load backend configurations profile.");
        }
    }, [fetch]);

    useEffect(() => {
        loadSkuSettings();
        loadMetafields();
    }, [loadSkuSettings]);

    const handleFieldChange = (key, value) => {
        setSkuSettings(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };


    const handleSave = useCallback(async () => {
        setLoading(true);
        setErrorBanner(null);
        try {
            const res = await fetch('/api/sku-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(skuSettings)
            });
            if (res.ok) {
                setToastActive(true);
                setIsDirty(false); // Hides the native save bar cleanly
            } else {
                setErrorBanner("Failed to save custom SKU configurations.");
            }
        } catch (err) {
            setErrorBanner("Server processing error occurred.");
        } finally {
            setLoading(false);
        }
    }, [skuSettings, fetch]);

    const handleDiscard = useCallback(async () => {
        setIsDirty(false);
        await loadSkuSettings();
    }, [loadSkuSettings]);

    return (
        <Frame>
            {/* NEW: App Bridge Native Save Bar Component Hooked up to State Controls */}
            <SaveBar id="sku-save-bar" open={isDirty}>
                <button variant="primary" loading={loading ? "true" : undefined} onClick={handleSave}>Save</button>
                <button onClick={handleDiscard}>Discard</button>
            </SaveBar>

            <Page
                title="SKU Settings"
                subtitle="Manage automated structuring parameters and formatting rules for your store inventory variants."
                backAction={{ content: 'Dashboard', url: '/' }}
            >
                <div style={{ marginTop: '20px' }}>
                    {errorBanner && (
                        <Banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            <p>{errorBanner}</p>
                        </Banner>
                    )}

                    <Layout>
                        <Layout.Section>
                            <Banner title="Live SKU Generation Structure Preview" tone="info">
                                <p style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', margin: '4px 0' }}>
                                    {generateSkuPreview()}
                                </p>
                            </Banner>
                        </Layout.Section>

                        <Layout.Section>
                            <Card padding="500">
                                <FormLayout>
                                    <Text variant="headingMd" as="h3">Pattern Base Parameters</Text>
                                    <FormLayout.Group>
                                        <TextField label="SKU Prefix" value={skuSettings.sku_prefix} onChange={(val) => handleFieldChange('sku_prefix', val)} autoComplete="off" />
                                        <TextField label="Auto-Number Start" value={skuSettings.sku_auto_number_start} onChange={(val) => handleFieldChange('sku_auto_number_start', val)} autoComplete="off" />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <TextField label="SKU Suffix" value={skuSettings.sku_suffix} onChange={(val) => handleFieldChange('sku_suffix', val)} autoComplete="off" />
                                        <TextField label="Delimiter Symbol" value={skuSettings.sku_delimiter} onChange={(val) => handleFieldChange('sku_delimiter', val)} autoComplete="off" />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Card>
                        </Layout.Section>

                        <Layout.Section>
                            <Card padding="500">
                                <FormLayout>
                                    <Text variant="headingMd" as="h3">Segment Selections Formula</Text>
                                    <FormLayout.Group>
                                        <Select label="Product Title" options={positionOptions} value={skuSettings.segment_product_title} onChange={(val) => handleFieldChange('segment_product_title', val)} />
                                        <Select label="Vendor" options={positionOptions} value={skuSettings.segment_product_vendor} onChange={(val) => handleFieldChange('segment_product_vendor', val)} />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <Select
                                            label="Product Type"
                                            options={positionOptions}
                                            value={skuSettings.segment_product_type}
                                            onChange={(val) =>
                                                handleFieldChange("segment_product_type", val)
                                            }
                                        />
                                        <Select
                                            label="Metafield"
                                            options={metafieldOptions}
                                            value={skuSettings.segment_metafield}
                                            onChange={(val) =>
                                                handleFieldChange("segment_metafield", val)
                                            }
                                        />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <Select
                                            label="Metafield Rule"
                                            options={positionOptions}
                                            value={skuSettings.segment_metafield_rule}
                                            onChange={(val) =>
                                                handleFieldChange("segment_metafield_rule", val)
                                            }
                                        />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <Select label="Option 1" options={positionOptions} value={skuSettings.segment_option1} onChange={(val) => handleFieldChange('segment_option1', val)} />
                                        <Select label="Option 2" options={positionOptions} value={skuSettings.segment_option2} onChange={(val) => handleFieldChange('segment_option2', val)} />
                                        <Select label="Option 3" options={positionOptions} value={skuSettings.segment_option3} onChange={(val) => handleFieldChange('segment_option3', val)} />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Card>
                        </Layout.Section>

                        {/* Formatting Options Card */}
                        <Layout.Section>
                            <Card padding="500">
                                <FormLayout>
                                    <Text variant="headingMd" as="h3">Formatting Options</Text>
                                    <Checkbox
                                        label="Hide variations options 1, 2, 3 segments"
                                        checked={skuSettings.hide_options_1_2_3}
                                        onChange={(val) => handleFieldChange('hide_options_1_2_3', val)}
                                    />
                                    <Checkbox
                                        label="Force generated codes text characters to Uppercase"
                                        checked={skuSettings.force_uppercase_fields}
                                        onChange={(val) => handleFieldChange('force_uppercase_fields', val)}
                                    />
                                </FormLayout>
                            </Card>
                        </Layout.Section>
                    </Layout>
                </div>
                {toastActive && <Toast content="SKU configuration parameters updated successfully!" onDismiss={() => setToastActive(false)} />}
            </Page>
        </Frame>
    );
}


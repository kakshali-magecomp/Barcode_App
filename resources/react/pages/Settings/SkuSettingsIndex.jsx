import React, { useState, useCallback, useEffect } from 'react';
import { Page, Layout, Card, FormLayout, TextField, Select, Checkbox, BlockStack, ContextualSaveBar, Frame, Toast, Banner } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';

export default function SkuSettingsIndex() {
    const appBridge = useAppBridge();
    const fetch = window.fetch;

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
        segment_metafields: 'none',
        hide_options_1_2_3: false,
        force_uppercase_fields: true
    });

    // Page UI Feedback Controllers
    const [isDirty, setIsDirty] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toastActive, setToastActive] = useState(false);
    const [errorBanner, setErrorBanner] = useState(null);

    // Dynamic Position Selection Dropdown Items
    const positionOptions = [
        { label: 'Choose an option', value: 'none' },
        { label: 'Not used', value: 'disabled' },
        { label: 'First character', value: 'char_1' },
        { label: 'First 2 characters', value: 'char_2' },
        { label: 'First 3 characters', value: 'char_3' },
        { label: 'First 4 characters', value: 'char_4' },
        { label: 'Full value', value: 'full' }
    ];


    const metafieldOptions = [
        { label: 'Disabled', value: 'none' },
        { label: 'custom.isbn', value: 'isbn' },
        { label: 'custom.manufacture_code', value: 'mfg_code' }
    ];

    // Real-Time Generated SKU Output Preview Engine
    const generateSkuPreview = () => {
    const delimiter = skuSettings.sku_delimiter || '-';
    let segments = [];
    
    // 1. Static Prefix
    if (skuSettings.sku_prefix) segments.push(skuSettings.sku_prefix);
    
    // Helper function to extract correct substrings based on the dropdown choice
    const extractSubstring = (text, rule) => {
        if (!rule || rule === 'none' || rule === 'disabled') return null;
        if (rule === 'full') return text;
        if (rule === 'char_1') return text.substring(0, 1);
        if (rule === 'char_2') return text.substring(0, 2);
        if (rule === 'char_3') return text.substring(0, 3);
        if (rule === 'char_4') return text.substring(0, 4);
        return null;
    };

    // Mock store data mimicking a live Shopify item (e.g., "Nike Running Shoes")
    const mockProduct = {
        title: 'Product Name Example',
        vendor: 'Example Vendor',
        type: 'Example Type',
        option1: 'example_option1',
    };

    // Parse each attribute sequentially 
    const titlePart = extractSubstring(mockProduct.title, skuSettings.segment_product_title);
    if (titlePart) segments.push(titlePart);

    const vendorPart = extractSubstring(mockProduct.vendor, skuSettings.segment_product_vendor);
    if (vendorPart) segments.push(vendorPart);

    const typePart = extractSubstring(mockProduct.type, skuSettings.segment_product_type);
    if (typePart) segments.push(typePart);

    const opt1Part = extractSubstring(mockProduct.option1, skuSettings.segment_option1);
    if (opt1Part) segments.push(opt1Part);

    // 2. Incremental Serial Number Block
    segments.push(skuSettings.sku_auto_number_start || '1001');
    
    // 3. Static Suffix
    if (skuSettings.sku_suffix) segments.push(skuSettings.sku_suffix);

    let finalPreview = segments.join(delimiter);
    return skuSettings.force_uppercase_fields ? finalPreview.toUpperCase() : finalPreview;
};


    // Pull initial SKU profile from backend database
    useEffect(() => {
        async function loadSkuSettings() {
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
                        segment_option1: data.segment_option1 || 'none',
                        segment_option2: data.segment_option2 || 'none',
                        segment_option3: data.segment_option3 || 'none',
                        segment_metafields: data.segment_metafields || 'none',
                        hide_options_1_2_3: !!data.hide_options_1_2_3,
                        force_uppercase_fields: !!data.force_uppercase_fields
                    });
                }
            } catch (err) {
                setErrorBanner("Could not load backend configurations profile.");
            }
        }
        loadSkuSettings();
    }, [fetch]);

    // Handle single form input shifts safely
    const handleFieldChange = (key, value) => {
        setSkuSettings(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    // Submit payload directly to separate SKU controller endpoint
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
                setIsDirty(false); // Cleans layout page tracking state
            } else {
                setErrorBanner("Failed to save custom SKU configurations.");
            }
        } catch (err) {
            setErrorBanner("Server processing error occurred.");
        } finally {
            setLoading(false);
        }
    }, [skuSettings, fetch]);

    return (
        <Frame>
            {isDirty && (
                <ContextualSaveBar
                    message="Unsaved SKU configuration changes"
                    saveAction={{ loading, onAction: handleSave }}
                    discardAction={{ onAction: () => setIsDirty(false) }}
                />
            )}

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
                        {/* Live SKU Pattern Renderer Banner */}
                        <Layout.Section>
                            <Banner title="Live SKU Generation Structure Preview" tone="info">
                                <p style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', margin: '4px 0' }}>
                                    {generateSkuPreview()}
                                </p>
                            </Banner>
                        </Layout.Section>

                        {/* Row 1: Structural String Base Blocks */}
                        <Layout.Section variant="oneThird">
                            <BlockStack gap="200">
                                <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Pattern Base Parameters</h2>
                                <p style={{ color: '#6d7175' }}>Set up simple static structural prefix strings, starting numbers, and dividers.</p>
                            </BlockStack>
                        </Layout.Section>

                        <Layout.Section>
                            <Card padding="500">
                                <FormLayout>
                                    <FormLayout.Group>
                                        <TextField
                                            label="SKU Prefix"
                                            value={skuSettings.sku_prefix}
                                            onChange={(val) => handleFieldChange('sku_prefix', val)}
                                            autoComplete="off"
                                            placeholder="e.g., PROD"
                                        />
                                        <TextField
                                            label="Auto Number Start From"
                                            type="number"
                                            value={skuSettings.sku_auto_number_start}
                                            onChange={(val) => handleFieldChange('sku_auto_number_start', val)}
                                            autoComplete="off"
                                        />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <TextField
                                            label="SKU Suffix"
                                            value={skuSettings.sku_suffix}
                                            onChange={(val) => handleFieldChange('sku_suffix', val)}
                                            autoComplete="off"
                                            placeholder="e.g., 2024"
                                        />
                                        <TextField
                                            label="Use Delimiter"
                                            value={skuSettings.sku_delimiter}
                                            onChange={(val) => handleFieldChange('sku_delimiter', val)}
                                            autoComplete="off"
                                            placeholder="-"
                                            maxLength={1}
                                        />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Card>
                        </Layout.Section>

                        {/* Row 2: Product Attribute Dropdowns */}
                        <Layout.Section variant="oneThird">
                            <BlockStack gap="200">
                                <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Dynamic Attribute Ordering</h2>
                                <p style={{ color: '#6d7175' }}>Assign explicit placements to dynamically map variants directly out of your product data strings.</p>
                            </BlockStack>
                        </Layout.Section>

                        <Layout.Section>
                            <Card padding="500">
                                <FormLayout>
                                    <FormLayout.Group>
                                        <Select
                                            label="Product Title"
                                            options={positionOptions}
                                            value={skuSettings.segment_product_title}
                                            onChange={(val) => handleFieldChange('segment_product_title', val)}
                                        />
                                        <Select
                                            label="Product Vendor"
                                            options={positionOptions}
                                            value={skuSettings.segment_product_vendor}
                                            onChange={(val) => handleFieldChange('segment_product_vendor', val)}
                                        />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <Select
                                            label="Product Type"
                                            options={positionOptions}
                                            value={skuSettings.segment_product_type}
                                            onChange={(val) => handleFieldChange('segment_product_type', val)}
                                        />
                                        <Select
                                            label="Use Metafields"
                                            options={metafieldOptions}
                                            value={skuSettings.segment_metafields}
                                            onChange={(val) => handleFieldChange('segment_metafields', val)}
                                        />
                                    </FormLayout.Group>
                                    <FormLayout.Group>
                                        <Select
                                            label="Option 1 Value"
                                            options={positionOptions}
                                            value={skuSettings.segment_option1}
                                            onChange={(val) => handleFieldChange('segment_option1', val)}
                                        />
                                        <Select
                                            label="Option 2 Value"
                                            options={positionOptions}
                                            value={skuSettings.segment_option2}
                                            onChange={(val) => handleFieldChange('segment_option2', val)}
                                        />
                                        <Select
                                            label="Option 3 Value"
                                            options={positionOptions}
                                            value={skuSettings.segment_option3}
                                            onChange={(val) => handleFieldChange('segment_option3', val)}
                                        />
                                    </FormLayout.Group>
                                </FormLayout>
                            </Card>
                        </Layout.Section>

                        {/* Row 3: Rule Logic Checkboxes */}
                        <Layout.Section variant="oneThird">
                            <BlockStack gap="200">
                                <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Automation Enforcements</h2>
                                <p style={{ color: '#6d7175' }}>Enforce strict letter modifications or toggle hidden item parameters configurations.</p>
                            </BlockStack>
                        </Layout.Section>

                        <Layout.Section>
                            <Card padding="500">
                                <FormLayout>
                                    <Checkbox
                                        label="Hide option 1 and 2 and 3 values"
                                        checked={skuSettings.hide_options_1_2_3}
                                        onChange={(val) => handleFieldChange('hide_options_1_2_3', val)}
                                    />
                                    <Checkbox
                                        label="Use UPPERCASE letters for fields that cannot be entered directly"
                                        checked={skuSettings.force_uppercase_fields}
                                        onChange={(val) => handleFieldChange('force_uppercase_fields', val)}
                                    />
                                </FormLayout>
                            </Card>
                        </Layout.Section>
                    </Layout>
                </div>
            </Page>
            {toastActive && <Toast content="SKU generation profile saved successfully!" onDismiss={() => setToastActive(false)} />}
        </Frame>
    );
}

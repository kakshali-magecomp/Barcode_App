import React, { useState, useCallback, useEffect } from 'react';
import { useAppBridge } from '@shopify/app-bridge-react';

const SAVE_BAR_ID = 'sku-save-bar';

export default function SkuSettingsIndex() {
    const shopify = useAppBridge();

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
    const [errorBanner, setErrorBanner] = useState(null);

    const loadMetafields = useCallback(async () => {
        try {
            const response = await fetch("/api/products");
            const json = await response.json();
            setMetafieldOptions(
                json.metafield_options || []
            );
        } catch (error) {
            console.error(error);
        }
    }, []);

    const positionOptions = [
        { label: 'Choose an option', value: 'none' },
        { label: 'Not used', value: 'disabled' },
        { label: 'First character', value: 'char_1' },
        { label: 'First 2 characters', value: 'char_2' },
        { label: 'First 3 characters', value: 'char_3' },
        { label: 'First 4 characters', value: 'char_4' },
        { label: 'Full value', value: 'full' }
    ];

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
            metafields:
                skuSettings.preview_metafields || {},

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

        const metafieldValue = mockProduct.metafields[skuSettings.segment_metafield] || "";
        const metafieldPart = extractSubstring(metafieldValue, skuSettings.segment_metafield_rule);
        if (metafieldPart) segments.push(metafieldPart);

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
                setIsDirty(false);
            }
        } catch (err) {
            setErrorBanner("Could not load backend configurations profile.");
        }
    }, []);

    useEffect(() => {
        loadSkuSettings();
        loadMetafields();
    }, [loadSkuSettings, loadMetafields]);

    useEffect(() => {
        if (isDirty) {
            shopify.saveBar.show(SAVE_BAR_ID);
        } else {
            shopify.saveBar.hide(SAVE_BAR_ID);
        }
    }, [isDirty, shopify]);

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
                shopify.toast.show("SKU configuration parameters updated successfully!");
                setIsDirty(false);
            } else {
                let message = "Failed to save custom SKU configurations.";
                try {
                    const errJson = await res.json();
                    if (errJson?.message) message = errJson.message;
                    else if (errJson?.errors) message = Object.values(errJson.errors).flat().join(' ');
                } catch { /* response wasn't JSON, keep the generic message */ }
                setErrorBanner(message);
            }
        } catch (err) {
            setErrorBanner("Server processing error occurred.");
        } finally {
            setLoading(false);
        }
    }, [skuSettings, shopify]);

    const handleDiscard = useCallback(async () => {
        setIsDirty(false);
        await loadSkuSettings();
    }, [loadSkuSettings]);

    return (
        <>
            <ui-save-bar id={SAVE_BAR_ID}>
                <button variant="primary" loading={loading || undefined} onClick={handleSave}>Save</button>
                <button onClick={handleDiscard}>Discard</button>
            </ui-save-bar>

            <s-page heading="SKU Generation Settings">
                {errorBanner && (
                    <s-section>
                        <s-banner tone="critical" onDismiss={() => setErrorBanner(null)}>
                            {errorBanner}
                        </s-banner>
                    </s-section>
                )}

                <s-section>
                    <s-banner heading="Live SKU Generation Structure Preview" tone="info">
                        <p style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', margin: '4px 0' }}>
                            {generateSkuPreview()}
                        </p>
                    </s-banner>
                </s-section>

                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-heading>Pattern Base Parameters</s-heading>
                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <s-text-field
                                label="SKU Prefix"
                                value={skuSettings.sku_prefix}
                                onInput={(e) => handleFieldChange('sku_prefix', e.currentTarget.value)}
                            />
                            <s-text-field
                                label="Auto-Number Start"
                                value={skuSettings.sku_auto_number_start}
                                onInput={(e) => handleFieldChange('sku_auto_number_start', e.currentTarget.value)}
                            />
                        </s-grid>
                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <s-text-field
                                label="SKU Suffix"
                                value={skuSettings.sku_suffix}
                                onInput={(e) => handleFieldChange('sku_suffix', e.currentTarget.value)}
                            />
                            <s-text-field
                                label="Delimiter Symbol"
                                value={skuSettings.sku_delimiter}
                                onInput={(e) => handleFieldChange('sku_delimiter', e.currentTarget.value)}
                            />
                        </s-grid>
                    </s-stack>
                </s-section>

                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-heading>Segment Selections Formula</s-heading>

                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <s-select
                                label="Product Title"
                                value={skuSettings.segment_product_title}
                                onChange={(e) => handleFieldChange('segment_product_title', e.currentTarget.value)}
                            >
                                {positionOptions.map(opt => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                ))}
                            </s-select>
                            <s-select
                                label="Vendor"
                                value={skuSettings.segment_product_vendor}
                                onChange={(e) => handleFieldChange('segment_product_vendor', e.currentTarget.value)}
                            >
                                {positionOptions.map(opt => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                ))}
                            </s-select>
                        </s-grid>

                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <s-select
                                label="Product Type"
                                value={skuSettings.segment_product_type}
                                onChange={(e) => handleFieldChange('segment_product_type', e.currentTarget.value)}
                            >
                                {positionOptions.map(opt => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                ))}
                            </s-select>
                            <s-select
                                label="Metafield"
                                value={skuSettings.segment_metafield}
                                onChange={(e) => handleFieldChange('segment_metafield', e.currentTarget.value)}
                            >
                                {metafieldOptions.map(opt => (
                                    <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                                ))}
                            </s-select>
                        </s-grid>

                        <s-select
                            label="Metafield Rule"
                            value={skuSettings.segment_metafield_rule}
                            onChange={(e) => handleFieldChange('segment_metafield_rule', e.currentTarget.value)}
                        >
                            {positionOptions.map(opt => (
                                <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                            ))}
                        </s-select>
                    </s-stack>
                </s-section>

                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-heading>Formatting Options</s-heading>
                        <s-checkbox
                            label="Force generated codes text characters to Uppercase"
                            checked={skuSettings.force_uppercase_fields || undefined}
                            onChange={(e) => handleFieldChange('force_uppercase_fields', e.currentTarget.checked)}
                        />
                    </s-stack>
                </s-section>
            </s-page>
        </>
    );
}
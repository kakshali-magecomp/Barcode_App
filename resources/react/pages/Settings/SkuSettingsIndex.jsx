import React, { useEffect, useState } from 'react';

export default function SkuSettingsIndex({ settings = {}, onChange }) {
    const [metafieldOptions, setMetafieldOptions] = useState([]);

    const positionOptions = [
        { label: 'Choose an option', value: 'none' },
        { label: 'Not used', value: 'disabled' },
        { label: 'First character', value: 'char_1' },
        { label: 'First 2 characters', value: 'char_2' },
        { label: 'First 3 characters', value: 'char_3' },
        { label: 'First 4 characters', value: 'char_4' },
        { label: 'Full value', value: 'full' }
    ];

    useEffect(() => {
        async function fetchMetafields() {
            try {
                const response = await fetch('/api/products');

                if (!response.ok) {
                    return;
                }

                const data = await response.json();

                setMetafieldOptions(data.metafield_options || []);
            } catch (error) {
                console.error('Error loading metafields:', error);
            }
        }

        fetchMetafields();
    }, []);

    const extractSubstring = (text, rule) => {
        if (!rule || rule === 'none' || rule === 'disabled') {
            return '';
        }

        const value = String(text || '');

        if (!value) {
            return '';
        }

        switch (rule) {
            case 'full':
                return value;

            case 'char_1':
                return value.substring(0, 1);

            case 'char_2':
                return value.substring(0, 2);

            case 'char_3':
                return value.substring(0, 3);

            case 'char_4':
                return value.substring(0, 4);

            default:
                return '';
        }
    };

    const cleanPreviewValue = (value) => {
        if (!value) {
            return '';
        }

        return String(value)
            .trim()
            .replace(/\s+/g, '');
    };

    const generateSkuPreview = () => {
        const delimiter = settings.sku_delimiter || '-';
        const segments = [];

        if (settings.sku_prefix) {
            segments.push(cleanPreviewValue(settings.sku_prefix));
        }

        const title = extractSubstring(
            'Product Name Example',
            settings.segment_product_title
        );

        if (title) {
            segments.push(cleanPreviewValue(title));
        }

        const vendor = extractSubstring(
            'Example Vendor',
            settings.segment_product_vendor
        );

        if (vendor) {
            segments.push(cleanPreviewValue(vendor));
        }

        const productType = extractSubstring(
            'Example Type',
            settings.segment_product_type
        );

        if (productType) {
            segments.push(cleanPreviewValue(productType));
        }

        if (settings.segment_metafield) {
            const metafield = metafieldOptions.find(
                option =>
                    String(option.value) ===
                    String(settings.segment_metafield)
            );

            const metafieldPreviewValue =
                metafield?.preview_value ||
                metafield?.sample_value ||
                'Testing Notes';

            const metafieldPart = extractSubstring(
                metafieldPreviewValue,
                settings.segment_metafield_rule
            );

            if (metafieldPart) {
                segments.push(cleanPreviewValue(metafieldPart));
            }
        }

        if (!settings.hide_options_1_2_3) {
            const option1 = extractSubstring(
                'Example Option 1',
                settings.segment_option1
            );

            const option2 = extractSubstring(
                'Example Option 2',
                settings.segment_option2
            );

            const option3 = extractSubstring(
                'Example Option 3',
                settings.segment_option3
            );

            if (option1) {
                segments.push(cleanPreviewValue(option1));
            }

            if (option2) {
                segments.push(cleanPreviewValue(option2));
            }

            if (option3) {
                segments.push(cleanPreviewValue(option3));
            }
        }

        segments.push(
            settings.sku_auto_number_start || '1001'
        );

        if (settings.sku_suffix) {
            segments.push(
                cleanPreviewValue(settings.sku_suffix)
            );
        }

        const finalPreview = segments
            .filter(Boolean)
            .join(delimiter);

        return settings.force_uppercase_fields
            ? finalPreview.toUpperCase()
            : finalPreview;
    };

    const handleChange = (key, value) => {
        if (typeof onChange === 'function') {
            onChange(key, value);
        }
    };

    return (
        <>
            <s-section>
                <s-banner
                    heading="Live SKU Generation Structure Preview"
                    tone="info"
                >
                    <p
                        style={{
                            fontSize: '18px',
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            margin: '4px 0'
                        }}
                    >
                        {generateSkuPreview()}
                    </p>
                </s-banner>
            </s-section>

            <s-section>
                <s-stack direction="block" gap="base">
                    <s-heading>
                        Pattern Base Parameters
                    </s-heading>

                    <s-grid
                        gridTemplateColumns="1fr 1fr"
                        gap="base"
                    >
                        <s-text-field
                            label="SKU Prefix"
                            value={settings.sku_prefix || ''}
                            onInput={e =>
                                handleChange(
                                    'sku_prefix',
                                    e.currentTarget.value
                                )
                            }
                        />

                        <s-text-field
                            label="Auto-Number Start"
                            value={
                                settings.sku_auto_number_start !== undefined
                                    ? String(
                                        settings.sku_auto_number_start
                                    )
                                    : '1001'
                            }
                            onInput={e =>
                                handleChange(
                                    'sku_auto_number_start',
                                    e.currentTarget.value
                                )
                            }
                        />
                    </s-grid>

                    <s-grid
                        gridTemplateColumns="1fr 1fr"
                        gap="base"
                    >
                        <s-text-field
                            label="SKU Suffix"
                            value={settings.sku_suffix || ''}
                            onInput={e =>
                                handleChange(
                                    'sku_suffix',
                                    e.currentTarget.value
                                )
                            }
                        />

                        <s-text-field
                            label="Delimiter Symbol"
                            value={settings.sku_delimiter || '-'}
                            onInput={e =>
                                handleChange(
                                    'sku_delimiter',
                                    e.currentTarget.value
                                )
                            }
                        />
                    </s-grid>
                </s-stack>
            </s-section>

            <s-section>
                <s-stack direction="block" gap="base">
                    <s-heading>
                        Segment Selections Formula
                    </s-heading>

                    <s-grid
                        gridTemplateColumns="1fr 1fr"
                        gap="base"
                    >
                        <s-select
                            label="Product Title"
                            value={
                                settings.segment_product_title ||
                                'none'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_product_title',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>

                        <s-select
                            label="Vendor"
                            value={
                                settings.segment_product_vendor ||
                                'none'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_product_vendor',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>
                    </s-grid>

                    <s-grid
                        gridTemplateColumns="1fr 1fr 1fr"
                        gap="base"
                    >
                        <s-select
                            label="Product Type"
                            value={
                                settings.segment_product_type ||
                                'none'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_product_type',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>

                        <s-select
                            label="Metafield"
                            value={
                                settings.segment_metafield || ''
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_metafield',
                                    e.currentTarget.value
                                )
                            }
                        >
                            <s-option value="">
                                Not used
                            </s-option>

                            {metafieldOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>

                        <s-select
                            label="Metafield Rule"
                            value={
                                settings.segment_metafield_rule ||
                                'full'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_metafield_rule',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>
                    </s-grid>

                    <s-grid
                        gridTemplateColumns="1fr 1fr 1fr"
                        gap="base"
                    >
                        <s-select
                            label="Variant Option 1"
                            value={
                                settings.segment_option1 ||
                                'none'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_option1',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>

                        <s-select
                            label="Variant Option 2"
                            value={
                                settings.segment_option2 ||
                                'none'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_option2',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>

                        <s-select
                            label="Variant Option 3"
                            value={
                                settings.segment_option3 ||
                                'none'
                            }
                            onChange={e =>
                                handleChange(
                                    'segment_option3',
                                    e.currentTarget.value
                                )
                            }
                        >
                            {positionOptions.map(option => (
                                <s-option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </s-option>
                            ))}
                        </s-select>
                    </s-grid>
                </s-stack>
            </s-section>

            <s-section>
                <s-stack direction="block" gap="base">
                    <s-heading>
                        Formatting Options
                    </s-heading>

                    <s-checkbox
                        label="Auto generate SKU after creating a new product"
                        checked={
                            !!settings.auto_generate_on_create
                        }
                        onChange={e =>
                            handleChange(
                                'auto_generate_on_create',
                                e.currentTarget.checked
                            )
                        }
                    />

                    <s-checkbox
                        label="Hide variant options 1, 2 and 3"
                        checked={
                            !!settings.hide_options_1_2_3
                        }
                        onChange={e =>
                            handleChange(
                                'hide_options_1_2_3',
                                e.currentTarget.checked
                            )
                        }
                    />

                    <s-checkbox
                        label="Force generated codes text characters to Uppercase"
                        checked={
                            !!settings.force_uppercase_fields
                        }
                        onChange={e =>
                            handleChange(
                                'force_uppercase_fields',
                                e.currentTarget.checked
                            )
                        }
                    />
                </s-stack>
            </s-section>
        </>
    );
}
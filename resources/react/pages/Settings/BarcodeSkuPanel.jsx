import React, { useEffect } from 'react';

export default function BarcodeSkuPanel({ settings, onChange }) {
    const formatOptions = [
        { label: 'Code 128 (Recommended)', value: 'CODE128' },
        { label: 'Code 39', value: 'CODE39' },
        { label: 'EAN 8', value: 'EAN8' },
        { label: 'EAN 13', value: 'EAN13' },
        { label: 'UPC-A', value: 'UPCA' },
        { label: 'ITF-14', value: 'ITF14' }
    ];

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/barcode-settings');
                const data = await response.json();
                if (data.success) {
                    onChange('barcode_format', data.settings.barcode_format || 'CODE128');
                    onChange('barcode_pattern', data.settings.barcode_pattern || '');
                    onChange('contextual_pricing_value', data.settings.contextual_pricing_value || '');
                    onChange('auto_generate_on_create', data.settings.auto_generate_on_create || false);
                    onChange('auto_detect_gtin_format', data.settings.auto_detect_gtin_format || false);
                    onChange('prevent_zero_start_end', data.settings.prevent_zero_start_end || false);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        }
        fetchSettings();
    }, []);

    return (
        <s-stack direction="block" gap="loose">
            <s-grid gridTemplateColumns="1fr 2fr" gap="base" >
                <s-stack direction="block" gap="tight">
                    <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Automation Triggers</h2>
                    <p style={{ color: '#6d7175' }}>Control when your app auto-creates or alters newly indexed barcodes.</p>
                </s-stack>

                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-checkbox
                            label="Auto generate barcode after creating a new product"
                            checked={settings.auto_generate_on_create || undefined}
                            onChange={(e) => onChange('auto_generate_on_create', e.currentTarget.checked)}
                        />
                        <s-checkbox
                            label="Auto detect barcode GTIN format and render correct symbol"
                            checked={settings.auto_detect_gtin_format || undefined}
                            onChange={(e) => onChange('auto_detect_gtin_format', e.currentTarget.checked)}
                        />
                        <s-checkbox
                            label="Generate barcodes that do not begin or end with zero"
                            checked={settings.prevent_zero_start_end || undefined}
                            onChange={(e) => onChange('prevent_zero_start_end', e.currentTarget.checked)}
                        />
                    </s-stack>
                </s-section>
            </s-grid>
            
            <div style={{ height: '32px' }}></div>
            <s-grid gridTemplateColumns="1fr 2fr" gap="base" style={{ marginBottom: '32px' }}>
                <s-stack direction="block" gap="tight">
                    <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Formatting Engines</h2>
                    <p style={{ color: '#6d7175' }}>Define specific output patterns, value variants, and label styles.</p>
                </s-stack>

                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-select
                            label="Generate Barcode Format"
                            value={settings.barcode_format}
                            onChange={(e) => onChange('barcode_format', e.currentTarget.value)}
                        >
                            {formatOptions.map(opt => (
                                <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                            ))}
                        </s-select>

                        <div style={{ color: '#6d7175', fontSize: '13px' }}>
                            <p style={{ margin: '0 0 4px' }}>Used to generate barcodes. For example:</p>
                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                <li>[A.8] - 8 alpha characters</li>
                                <li>[N.8] - 8 numeric characters</li>
                                <li>[EAN8] - 7 numeric characters</li>
                                <li>[EAN13] - 12 numeric characters</li>
                                <li>[UPC-A] - 11 numeric characters</li>
                                <li>[ITF14] - 13 numeric characters</li>
                            </ul>
                        </div>

                        <s-text-field
                            label="Barcode Pattern Layout"
                            value={settings.barcode_pattern || ''}
                            onInput={(e) => onChange('barcode_pattern', e.currentTarget.value)}
                            placeholder="e.g., [N.8]"
                        />
                        <s-text-field
                            label="Contextual Pricing Value"
                            value={settings.contextual_pricing_value || ''}
                            onInput={(e) => onChange('contextual_pricing_value', e.currentTarget.value)}
                        />
                    </s-stack>
                </s-section>
            </s-grid>
        </s-stack>
    );
}
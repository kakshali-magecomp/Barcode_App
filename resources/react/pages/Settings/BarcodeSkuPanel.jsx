import React, { useEffect } from 'react';
import { Layout, Card, FormLayout, TextField, Select, Checkbox, BlockStack } from '@shopify/polaris';

export default function BarcodeSkuPanel({ settings, onChange }) {
    const formatOptions = [
        { label: 'Code 128 (Recommended)', value: 'CODE128' },
        { label: 'Code 39', value: 'Code39' },
        { label: 'UPC-A', value: 'UPCA' },
        { label: 'EAN 8', value: 'EAN8' },
        { label: 'EAN 13', value: 'EAN13' },
        { label: 'ITF-14', value: 'EAN14' }
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
    }, [settings]);

    return (
        <Layout>
            <Layout.Section variant="oneThird">
                <BlockStack gap="200">
                    <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Automation Triggers</h2>
                    <p style={{ color: '#6d7175' }}>Control when your app auto-creates or alters newly indexed barcodes.</p>
                </BlockStack>
            </Layout.Section>

            <Layout.Section>
                <Card padding="500">
                    <FormLayout>
                        <Checkbox
                            label="Auto generate barcode after creating a new product"
                            checked={settings.auto_generate_on_create}
                            onChange={(val) => onChange('auto_generate_on_create', val)}
                        />
                        <Checkbox
                            label="Auto detect barcode GTIN format and render correct symbol"
                            checked={settings.auto_detect_gtin_format}
                            onChange={(val) => onChange('auto_detect_gtin_format', val)}
                        />
                        <Checkbox
                            label="Generate barcodes that do not begin or end with zero"
                            checked={settings.prevent_zero_start_end}
                            onChange={(val) => onChange('prevent_zero_start_end', val)}
                        />
                    </FormLayout>
                </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
                <BlockStack gap="200">
                    <h2 style={{ fontSize: '16px', fontWeight: '600' }}>Formatting Engines</h2>
                    <p style={{ color: '#6d7175' }}>Define specific output patterns, value variants, and label styles.</p>
                </BlockStack>
            </Layout.Section>

            <Layout.Section>
                <Card padding="500">
                    <FormLayout>
                        <Select
                            label="Generate Barcode Format"
                            options={formatOptions}
                            value={settings.barcode_format}
                            onChange={(val) => onChange('barcode_format', val)}
                        />
                        <text>
                            [N.8]</text>
                           <text> Used to generate barcodes. For example:</text>
                            <text>[A.8] - 8 alpha characters</text>
                            <text>[N.4] - 4 numeric characters</text>
                        
                        <TextField
                            label="Barcode Pattern Layout"
                            value={settings.barcode_pattern || ''}
                            onChange={(val) => onChange('barcode_pattern', val)}
                            placeholder="e.g., [N.8]"
                            autoComplete="off"
                        />
                        <TextField
                            label="Contextual Pricing Value "
                            value={settings.contextual_pricing_value || ''}
                            onChange={(val) => onChange('contextual_pricing_value', val)}
                            autoComplete="off"
                        />
                    </FormLayout>
                </Card>
            </Layout.Section>
        </Layout>
    );
}

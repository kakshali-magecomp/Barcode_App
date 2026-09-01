import React, { useEffect, useState } from 'react';
import { FieldLabelWithTooltip, SectionHeadingWithTooltip } from '../../components/FieldTooltip';

export default function BarcodeSkuPanel({ settings = {}, onChange }) {
    const [countryOptions, setCountryOptions] = useState([]);
    const [countriesLoaded, setCountriesLoaded] = useState(false);

    useEffect(() => {
        async function fetchCountries() {
            try {
                const response = await fetch('/api/contextual-pricing-countries');
                const data = await response.json();

                if (data.success !== false && data.status === 1) {
                    setCountryOptions(data.countries || []);
                }
            } catch (error) {
                console.error('Error fetching countries:', error);
            } finally {
                setCountriesLoaded(true);
            }
        }

        fetchCountries();
    }, []);

    const formatOptions = [
        { label: 'Code 128 (Recommended)', value: 'CODE128' },
        { label: 'Code 39', value: 'CODE39' },
        { label: 'EAN 8', value: 'EAN8' },
        { label: 'EAN 13', value: 'EAN13' },
        { label: 'UPC-A', value: 'UPCA' },
        { label: 'ITF-14', value: 'ITF14' },
    ];

    useEffect(() => {
        async function fetchSettings() {
            try {
                const response = await fetch('/api/barcode-settings');
                const data = await response.json();

                if (data.success && data.settings) {
                    onChange('barcode_format', data.settings.barcode_format || 'CODE128');
                    onChange('barcode_pattern', data.settings.barcode_pattern || '');
                    onChange('contextual_pricing_value', data.settings.contextual_pricing_value || '');
                    onChange('auto_generate_on_create', !!data.settings.auto_generate_on_create);
                    onChange('auto_detect_gtin_format', !!data.settings.auto_detect_gtin_format);
                    onChange('prevent_zero_start_end', !!data.settings.prevent_zero_start_end);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        }

        fetchSettings();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SECTION 1: AUTOMATION TRIGGERS */}
            <s-section>
                <s-stack direction="block" gap="medium">
                    <div>
                        <SectionHeadingWithTooltip
                            title="Automation Triggers"
                            tooltipText="Control when your app auto-creates or alters newly indexed barcodes."
                        />
                    </div>

                    <s-stack direction="block" gap="base">
                        <s-checkbox
                            label="Auto generate barcode after creating a new product"
                            checked={settings.auto_generate_on_create ? true : undefined}
                            onChange={(e) => onChange('auto_generate_on_create', e.currentTarget.checked)}
                        />

                        <s-checkbox
                            label="Auto detect barcode GTIN format and render correct symbol"
                            checked={settings.auto_detect_gtin_format ? true : undefined}
                            onChange={(e) => onChange('auto_detect_gtin_format', e.currentTarget.checked)}
                        />

                        <s-checkbox
                            label="Generate barcodes that do not begin or end with zero"
                            checked={settings.prevent_zero_start_end ? true : undefined}
                            onChange={(e) => onChange('prevent_zero_start_end', e.currentTarget.checked)}
                        />
                    </s-stack>
                </s-stack>
            </s-section>

            {/* SECTION 2: FORMATTING ENGINES */}
            <s-section>
                <s-stack direction="block" gap="medium">
                    <div>
                        <SectionHeadingWithTooltip
                            title="Formatting Engines"
                            tooltipText="Define specific output patterns, value variants, and label styles."
                        />
                    </div>

                    <s-stack direction="block" gap="base">
                        <div style={{ marginBottom: '16px' }}>
                            <FieldLabelWithTooltip
                                label="Default Barcode Format for Template Barcode Field"
                                tooltipText="Select standard barcode format (Code 128, EAN, UPC, etc.) used in label rendering."
                            />
                            <s-select
                                label="Default Barcode Format for Template Barcode Field"
                                labelAccessibilityVisibility="exclusive"
                                value={settings.barcode_format || 'CODE128'}
                                onChange={(e) => onChange('barcode_format', e.currentTarget.value)}
                            >
                                {formatOptions.map((opt) => (
                                    <s-option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </s-option>
                                ))}
                            </s-select>
                        </div>

                        {/* DIGIT FORMAT REFERENCE BOX WITH CLEAR SPACING */}
                        <div
                            style={{
                                background: '#f8fafc',
                                border: '1px solid #e1e3e5',
                                borderRadius: '10px',
                                padding: '16px',
                                marginBottom: '20px',
                            }}
                        >
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px' }}>
                                Used to generate barcodes. Supported pattern formats & digit counts:
                            </div>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                                    gap: '10px',
                                    fontSize: '12px',
                                    color: '#475569',
                                }}
                            >
                                <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#008ba8', fontWeight: 'bold' }}>[A.8]</code> — 8 alpha characters</div>
                                <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#008ba8', fontWeight: 'bold' }}>[N.8]</code> — 8 numeric characters</div>
                                <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#008ba8', fontWeight: 'bold' }}>[EAN8]</code> — 7 numeric characters</div>
                                <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#008ba8', fontWeight: 'bold' }}>[EAN13]</code> — 12 numeric characters</div>
                                <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#008ba8', fontWeight: 'bold' }}>[UPC-A]</code> — 11 numeric characters</div>
                                <div><code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#008ba8', fontWeight: 'bold' }}>[ITF14]</code> — 13 numeric characters</div>
                            </div>
                        </div>

                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <div>
                                <FieldLabelWithTooltip
                                    label="Barcode Generation Pattern"
                                    tooltipText="Define the pattern used to generate barcode values (e.g., [N.8] or [N.11])."
                                />
                                <s-text-field
                                    label="Barcode Generation Pattern"
                                    labelAccessibilityVisibility="exclusive"
                                    value={settings.barcode_pattern || ''}
                                    onInput={(e) => onChange('barcode_pattern', e.currentTarget.value)}
                                    placeholder="e.g., [N.8]"
                                />
                            </div>

                            <div>
                                <FieldLabelWithTooltip
                                    label="Contextual Pricing Value"
                                    tooltipText="Only countries with a Market configured in Shopify Admin appear here — this guarantees the selected country's price is actually used."
                                />
                                {!countriesLoaded ? (
                                    <s-select
                                        label="Contextual Pricing Value"
                                        labelAccessibilityVisibility="exclusive"
                                        value=""
                                        disabled
                                    >
                                        <s-option value="">Loading…</s-option>
                                    </s-select>
                                ) : (
                                    <s-select
                                        key={`contextual-pricing-select-${countryOptions.length}`}
                                        label="Contextual Pricing Value"
                                        labelAccessibilityVisibility="exclusive"
                                        value={
                                            countryOptions.find(
                                                option => String(option.value) === String(settings.contextual_pricing_value)
                                            )?.value ?? (settings.contextual_pricing_value || '')
                                        }
                                        onChange={(e) => onChange('contextual_pricing_value', e.currentTarget.value)}
                                    >
                                        <s-option value="">Select a country</s-option>
                                        {countryOptions.map((opt) => (
                                            <s-option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </s-option>
                                        ))}
                                    </s-select>
                                )}
                            </div>
                        </s-grid>
                    </s-stack>
                </s-stack>
            </s-section>
        </div>
    );
}
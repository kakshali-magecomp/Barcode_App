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

                        {/* SLEEK BARCODE PATTERNS INFO BANNER (STICKY ON SCROLL) */}
                        <div
                            style={{
                                position: 'sticky',
                                top: '12px',
                                zIndex: 10,
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                border: '1px solid #bae6fd',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                marginBottom: '16px',
                                boxShadow: '0 6px 18px rgba(3, 105, 161, 0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                    style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: '#0284c7',
                                        color: '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        flexShrink: 0,
                                    }}
                                >
                                    ℹ
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0c4a6e' }}>
                                    Supported Barcode Patterns & Tokens
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '6px 12px',
                                    fontSize: '12px',
                                    color: '#334155',
                                    paddingLeft: '30px',
                                }}
                            >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <code style={{ background: '#ffffff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace' }}>[A.8]</code>
                                    <span style={{ color: '#475569', fontSize: '12px' }}>8 alpha</span>
                                </span>
                                <span style={{ color: '#94a3b8' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <code style={{ background: '#ffffff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace' }}>[N.8]</code>
                                    <span style={{ color: '#475569', fontSize: '12px' }}>8 numeric</span>
                                </span>
                                <span style={{ color: '#94a3b8' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <code style={{ background: '#ffffff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace' }}>[N.7]</code>
                                    <span style={{ color: '#475569', fontSize: '12px' }}>EAN8</span>
                                </span>
                                <span style={{ color: '#94a3b8' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <code style={{ background: '#ffffff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace' }}>[N.12]</code>
                                    <span style={{ color: '#475569', fontSize: '12px' }}>EAN13</span>
                                </span>
                                <span style={{ color: '#94a3b8' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <code style={{ background: '#ffffff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace' }}>[N.11]</code>
                                    <span style={{ color: '#475569', fontSize: '12px' }}>UPC-A</span>
                                </span>
                                <span style={{ color: '#94a3b8' }}>•</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <code style={{ background: '#ffffff', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace' }}>[N.13]</code>
                                    <span style={{ color: '#475569', fontSize: '12px' }}>ITF14</span>
                                </span>
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
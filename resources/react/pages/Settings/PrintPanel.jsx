import React from 'react';
import CurrencyFormatSelect from '../../components/CurrencyFormatSelect';
import { FieldLabelWithTooltip, SectionHeadingWithTooltip } from '../../components/FieldTooltip';

export default function PrintPanel({
    settings = {},
    templates = [],
    onChange,
}) {
    const generateOptions = [
        {
            label: "Only generate barcode for selected products or variants that don't have barcode value yet",
            value: 'missing',
        },
        {
            label: "Generate barcode for all selected products or variants. Replace old values with new ones",
            value: 'replace',
        },
        {
            label: 'Generate barcode using product SKU attribute if barcode is missing',
            value: 'sku',
        },
        {
            label: 'Only Print Labels for selected products or variants that already have barcode',
            value: 'print',
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* SECTION 1: PRICE FORMATTING & CURRENCY */}
            <s-section>
                <s-stack direction="block" gap="medium">
                    <div>
                        <SectionHeadingWithTooltip
                            title="Price & Currency Formatting"
                            tooltipText="Configure price display decimals, tax rates, and currency symbol rules on printed labels."
                        />
                    </div>

                    <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                        <div>
                            <FieldLabelWithTooltip
                                label="Price Decimal Number"
                                tooltipText="Set the number of decimal places shown for product prices (e.g. 2 for 10.00)."
                            />
                            <s-text-field
                                label="Price Decimal Number"
                                labelAccessibilityVisibility="exclusive"
                                type="number"
                                value={
                                    settings.price_decimal_number !== undefined
                                        ? String(settings.price_decimal_number)
                                        : '2'
                                }
                                onInput={(e) => {
                                    const val = e.currentTarget.value;
                                    onChange('price_decimal_number', val === '' ? '' : parseInt(val) || 0);
                                }}
                            />
                        </div>

                        <CurrencyFormatSelect
                            value={settings.currency_format}
                            onChange={(value) => onChange('currency_format', value)}
                            label="Currency Format"
                            details="Select how the currency should be displayed on printed labels."
                        />
                    </s-grid>
                </s-stack>
            </s-section>

            {/* SECTION 2: PRINT QUANTITY & GENERATION DEFAULTS */}
            <s-section>
                <s-stack direction="block" gap="medium">
                    <div>
                        <SectionHeadingWithTooltip
                            title="Generation & Print Defaults"
                            tooltipText="Set default barcode generation modes, quantity presets, and tax additions."
                        />
                    </div>

                    <s-stack direction="block" gap="base">
                        <div>
                            <FieldLabelWithTooltip
                                label="Default Barcode Generate Option"
                                tooltipText="Select the default method for barcode generation when printing labels."
                            />
                            <s-select
                                label="Default Barcode Generate Option"
                                labelAccessibilityVisibility="exclusive"
                                value={settings.default_generate_option || 'missing'}
                                onChange={(e) => onChange('default_generate_option', e.currentTarget.value)}
                            >
                                {generateOptions.map((opt) => (
                                    <s-option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </s-option>
                                ))}
                            </s-select>
                        </div>

                        <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                            <div>
                                <FieldLabelWithTooltip
                                    label="Default Print Label Quantity"
                                    tooltipText="Set the default number of labels to print per selected item."
                                />
                                <s-text-field
                                    label="Default Print Label Quantity"
                                    labelAccessibilityVisibility="exclusive"
                                    type="number"
                                    value={
                                        settings.default_print_label_quantity !== undefined
                                            ? String(settings.default_print_label_quantity)
                                            : '1'
                                    }
                                    onInput={(e) => {
                                        const val = e.currentTarget.value;
                                        onChange('default_print_label_quantity', val === '' ? '' : parseInt(val) || 1);
                                    }}
                                />
                            </div>

                            <div>
                                <FieldLabelWithTooltip
                                    label="Tax Percentage"
                                    tooltipText="Enter the tax percentage to include in the displayed price."
                                />
                                <s-text-field
                                    label="Tax Percentage"
                                    labelAccessibilityVisibility="exclusive"
                                    type="number"
                                    suffix="%"
                                    value={
                                        settings.vat_percentage !== undefined
                                            ? String(settings.vat_percentage)
                                            : ''
                                    }
                                    onInput={(e) => {
                                        const val = e.currentTarget.value;
                                        onChange('vat_percentage', val === '' ? '' : parseFloat(val) || 0.00);
                                    }}
                                />
                            </div>
                        </s-grid>
                    </s-stack>
                </s-stack>
            </s-section>

            {/* SECTION 3: CATALOG & FILTERING RULES */}
            <s-section>
                <s-stack direction="block" gap="medium">
                    <div>
                        <SectionHeadingWithTooltip
                            title="Catalog & Workflow Rules"
                            tooltipText="Specify product visibility and automated sorting rules for label print jobs."
                        />
                    </div>

                    <s-stack direction="block" gap="base">
                        <s-checkbox
                            label="Sort by SKU"
                            checked={settings.sort_by_sku ? true : undefined}
                            onChange={(e) => onChange('sort_by_sku', e.currentTarget.checked)}
                        />

                        <s-checkbox
                            label="Hide product Draft when selection"
                            checked={settings.hide_product_draft ? true : undefined}
                            onChange={(e) => onChange('hide_product_draft', e.currentTarget.checked)}
                        />

                        <s-checkbox
                            label="Hide product archived when selection"
                            checked={settings.hide_product_archived ? true : undefined}
                            onChange={(e) => onChange('hide_product_archived', e.currentTarget.checked)}
                        />

                        <s-checkbox
                            label="Use Shopify flow action to generate barcode labels"
                            checked={settings.use_shopify_flow_action ? true : undefined}
                            onChange={(e) => onChange('use_shopify_flow_action', e.currentTarget.checked)}
                        />
                    </s-stack>
                </s-stack>
            </s-section>
        </div>
    );
}
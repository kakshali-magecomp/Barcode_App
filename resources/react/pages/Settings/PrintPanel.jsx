import React from 'react';

export default function PrintPanel({ settings = {}, templates = [], onChange }) {

    const currencyOptions = [
        {
            label: 'Without currency (e.g. 10.00)',
            value: 'without_currency'
        },
        {
            label: 'With currency (e.g. $10.00)',
            value: 'with_currency'
        },
        {
            label: 'Currency code (e.g. 10.00 USD)',
            value: 'currency_code'
        }
    ];
    const generateOptions = [
        { label: "Only generate barcode for selected products or variants that don't have barcode value yet", value: 'missing' },
        { label: "Generate barcode for all selected products or variants. If products or variants don't have barcode value, generate new barcode data. If products or variants already have barcode value, replace the old value with new one", value: 'replace' },
        { label: 'Generate barcode for all selected products or variants. If products or variants do not have barcode value, using products SKU attribute for generating barcode', value: 'sku' },
        { label: 'Only Print Labels for selected products or variants already have barcode', value: 'print' },
    ];

    const templateOptions = [
        { label: 'Select manually', value: 'manual' },
        ...templates.map(t => ({ label: t.template_name, value: String(t.id) }))
    ];

    return (
        <s-section>
            <s-stack direction="block" gap="base">
                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                    <s-text-field
                        label="Price Decimal Number"
                        type="number"
                        value={settings.price_decimal_number !== undefined ? String(settings.price_decimal_number) : '2'}
                        onInput={(e) => {
                            const val = e.currentTarget.value;
                            onChange('price_decimal_number', val === '' ? '' : (parseInt(val) || 0));
                        }}
                        details="Leave blank to round automatic"
                    />

                    <s-select
                        label="Currency Format"
                        value={settings.currency_format || 'without_currency'}
                        onChange={(e) => onChange('currency_format', e.currentTarget.value)}
                        details="This configuration is following the Setting of Shopify here"
                    >
                        {currencyOptions.map(opt => (
                            <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                        ))}
                    </s-select>
                </s-grid>

                <s-select
                    label="Default Barcode Generate Option"
                    value={settings.default_generate_option || 'missing'}
                    onChange={(e) => onChange('default_generate_option', e.currentTarget.value)}
                >
                    {generateOptions.map(opt => (
                        <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>
                    ))}
                </s-select>

                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                    <s-text-field
                        label="Default Print Label Quantity"
                        type="number"
                        value={settings.default_print_label_quantity !== undefined ? String(settings.default_print_label_quantity) : '1'}
                        onInput={(e) => {
                            const val = e.currentTarget.value;
                            onChange('default_print_label_quantity', val === '' ? '' : (parseInt(val) || 1));
                        }}
                        details="Leave blank to match inventory quantity"
                    />

                    <s-text-field
                        label="VAT Percentage"
                        type="number"
                        suffix="%"
                        value={settings.vat_percentage !== undefined ? String(settings.vat_percentage) : ''}
                        onInput={(e) => {
                            const val = e.currentTarget.value;
                            onChange('vat_percentage', val === '' ? '' : (parseFloat(val) || 0.00));
                        }}
                        details="A combination of both original Price and VAT."
                    />
                </s-grid>

                <s-checkbox
                    label="Sort by SKU"
                    checked={!!settings.sort_by_sku || undefined}
                    onChange={(e) => onChange('sort_by_sku', e.currentTarget.checked)}
                />

                <s-checkbox
                    label="Hide product Draft when selection"
                    checked={!!settings.hide_product_draft || undefined}
                    onChange={(e) => onChange('hide_product_draft', e.currentTarget.checked)}
                />

                <s-checkbox
                    label="Hide product archived when selection"
                    checked={!!settings.hide_product_archived || undefined}
                    onChange={(e) => onChange('hide_product_archived', e.currentTarget.checked)}
                />

                <s-checkbox
                    label="Use Shopify flow action to generate barcode labels"
                    checked={!!settings.use_shopify_flow_action || undefined}
                    onChange={(e) => onChange('use_shopify_flow_action', e.currentTarget.checked)}
                />
            </s-stack>
        </s-section>
    );
}
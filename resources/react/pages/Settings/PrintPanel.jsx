import React from 'react';
import { Card, FormLayout, TextField, Select, Checkbox, Box } from '@shopify/polaris';

export default function PrintPanel({ settings = {}, templates = [], onChange }) {
    
    const currencyOptions = [
        { label: 'Email without currency (e.g., 10.00)', value: 'without_currency' },
        { label: 'Email with currency', value: 'with_currency' }
    ];

    const generateOptions = [
        { label: 'Generate barcode for all selected products or variants. If products or variants don\'t have barcode v', value: 'manual' },
        { label: 'Auto-generate on inventory receipt', value: 'auto_receipt' }
    ];

    const templateOptions = [
        { label: 'Select manually', value: 'manual' },
        ...templates.map(t => ({ label: t.template_name, value: String(t.id) }))
    ];

    return (
        <Card padding="500">
            <FormLayout>
                <TextField
                    label="Price Decimal Number"
                    type="number"
                    // SAFE FALLBACK: Ensures empty fields don't mismatch string snapshots
                    value={settings.price_decimal_number !== undefined ? String(settings.price_decimal_number) : '2'}
                    onChange={(val) => onChange('price_decimal_number', val === '' ? '' : (parseInt(val) || 0))}
                    helpText="Leave blank to round automatic"
                    autoComplete="off"
                />

                <Select
                    label="Currency Format"
                    options={currencyOptions}
                    value={settings.currency_format || 'without_currency'}
                    onChange={(val) => onChange('currency_format', val)}
                    helpText="This configuration is following the Setting of Shopify here"
                />

                {/* <Select
                    label="Default Print Template"
                    options={templateOptions}
                    value={String(settings.default_print_template_id || 'manual')}
                    onChange={(val) => onChange('default_print_template_id', val === 'manual' ? null : parseInt(val))}
                /> */}

                <Select
                    label="Default Generate Option"
                    options={generateOptions}
                    value={settings.default_generate_option || 'manual'}
                    onChange={(val) => onChange('default_generate_option', val)}
                />

                <TextField
                    label="Default Print Label Quantity"
                    type="number"
                    value={settings.default_print_label_quantity !== undefined ? String(settings.default_print_label_quantity) : '1'}
                    onChange={(val) => onChange('default_print_label_quantity', val === '' ? '' : (parseInt(val) || 1))}
                    helpText="Leave blank to match inventory quantity"
                    autoComplete="off"
                />

                <TextField
                    label={
                        <Box display="flex" alignItems="center" gap="200">
                            <span>VAT Percentage</span>
                        </Box>
                    }
                    type="number"
                    suffix="%"
                    value={settings.vat_percentage !== undefined ? String(settings.vat_percentage) : ''}
                    onChange={(val) => onChange('vat_percentage', val === '' ? '' : (parseFloat(val) || 0.00))}
                    helpText="A combination of both original Price and VAT."
                    autoComplete="off"
                />

                <Checkbox
                    label="Sort by SKU"
                    checked={!!settings.sort_by_sku}
                    onChange={(val) => onChange('sort_by_sku', val)}
                />

                <Checkbox
                    label="Hide product draft when selection"
                    checked={!!settings.hide_product_draft}
                    onChange={(val) => onChange('hide_product_draft', val)}
                />

                <Checkbox
                    label="Hide product archived when selection"
                    checked={!!settings.hide_product_archived}
                    onChange={(val) => onChange('hide_product_archived', val)}
                />

                <Checkbox
                    label={
                        <Box display="flex" alignItems="center" gap="200">
                            <span>Use Shopify flow action to generate barcode labels</span>
                        </Box>
                    }
                    checked={!!settings.use_shopify_flow_action}
                    onChange={(val) => onChange('use_shopify_flow_action', val)}
                />
            </FormLayout>
        </Card>
    );
}

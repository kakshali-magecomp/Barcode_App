import React from 'react';
import { FieldLabelWithTooltip } from './FieldTooltip';

export const CURRENCY_FORMAT_OPTIONS = [
    {
        label: 'Without currency (e.g. 10.00)',
        value: 'without_currency',
    },
    {
        label: 'With currency (e.g. $10.00)',
        value: 'with_currency',
    },
    {
        label: 'Currency code (e.g. 10.00 USD)',
        value: 'currency_code',
    },
];

export default function CurrencyFormatSelect({
    value,
    onChange,
    label = 'Currency Format',
    details = 'Select how the currency should be displayed on printed labels.',
}) {
    return (
        <div>
            <FieldLabelWithTooltip label={label} tooltipText={details} />
            <s-select
                label={label}
                labelAccessibilityVisibility="exclusive"
                value={value || 'without_currency'}
                onChange={(e) => onChange(e.currentTarget.value)}
            >
                {CURRENCY_FORMAT_OPTIONS.map((option) => (
                    <s-option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </s-option>
                ))}
            </s-select>
        </div>
    );
}
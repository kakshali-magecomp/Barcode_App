import React from 'react';

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
    details = 'Select how the currency should be displayed.',
}) {
    return (
        <s-select
            label={label}
            value={value || 'without_currency'}
            onChange={(e) => onChange(e.currentTarget.value)}
            details={details}
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
    );
}
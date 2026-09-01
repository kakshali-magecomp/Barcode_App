import React from 'react';
import { Tooltip, Icon } from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';

export function FieldLabelWithTooltip({ label, tooltipText }) {
    if (!tooltipText) {
        return <span style={{ fontSize: '13px', fontWeight: 600, color: '#303030' }}>{label}</span>;
    }

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#303030' }}>{label}</span>
            <Tooltip content={tooltipText} dismissOnMouseOut preferredPosition="above">
                <span
                    style={{
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        transform: 'scale(0.88)',
                        color: '#5c5c5c',
                    }}
                >
                    <Icon source={InfoIcon} tone="subdued" />
                </span>
            </Tooltip>
        </div>
    );
}

export function SectionHeadingWithTooltip({ title, tooltipText }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <s-heading level="2">{title}</s-heading>
            {tooltipText && (
                <Tooltip content={tooltipText} dismissOnMouseOut preferredPosition="above">
                    <span
                        style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            color: '#5c5c5c',
                        }}
                    >
                        <Icon source={InfoIcon} tone="subdued" />
                    </span>
                </Tooltip>
            )}
        </div>
    );
}

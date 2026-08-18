import React from 'react';

export default function LineControls({ design, handleUpdate }) {

    return (
        <s-stack direction="block" gap="base">
            <s-section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #bbc3c9', paddingTop: '12px' }}>
                    <s-heading>Line 1: 1 limited</s-heading>
                    <s-icon type="settings" tone="subdued"></s-icon>
                </div>
                <div style={{ paddingTop: '12px' }}>
                    <s-checkbox
                        label="Sku"
                        checked={!!design.line1_sku || undefined}
                        onChange={(e) => handleUpdate('line1_sku', e.currentTarget.checked)}
                    />
                </div>
            </s-section>

            <s-section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #bbc3c9' }}>
                    <s-heading>Line 2: 4 limited</s-heading>
                    <s-icon type="settings" tone="subdued"></s-icon>
                </div>
                <s-stack direction="block" gap="tight" style={{ paddingTop: '12px' }}>
                    <s-checkbox
                        label="Name"
                        checked={!!design.line2_name || undefined}
                        onChange={(e) => handleUpdate('line2_name', e.currentTarget.checked)}
                    />
                    <s-checkbox
                        label="Price"
                        checked={!!design.line2_price || undefined}
                        onChange={(e) =>
                            handleUpdate("line2_price", e.currentTarget.checked)
                        }
                    />

                    {design.line2_price && (
                        <div style={{ padding: '12px', backgroundColor: '#f1f2f4', borderRadius: '4px' }}>
                            <s-text-field
                                label="Currency Format"
                                value={design.line2_currency_format}
                                onInput={(e) => handleUpdate('line2_currency_format', e.currentTarget.value)}
                            />
                        </div>
                    )}
                    <s-checkbox
                        label="Show Variants"
                        checked={!!design.line2_variant_option1 || undefined}
                        onChange={(e) => handleUpdate('line2_variant_option1', e.currentTarget.checked)}
                    />
                </s-stack>
            </s-section>

            <s-section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid #bbc3c9' }}>
                    <s-heading>Line 3: 4 limited</s-heading>
                    <s-icon type="settings" tone="subdued"></s-icon>
                </div>
                <div style={{ paddingTop: '12px' }}>
                    <s-checkbox
                        label="Vendor"
                        checked={!!design.line3_vendor || undefined}
                        onChange={(e) => handleUpdate('line3_vendor', e.currentTarget.checked)}
                    />
                </div>
            </s-section>
        </s-stack>
    );
}
import React from 'react';
import { Card, FormLayout, TextField, Checkbox, Box, Text, BlockStack } from '@shopify/polaris';

export default function LineControls({ design, handleUpdate }) {
    
    return (
        <BlockStack gap="400">
            <Card padding="400">
                <Box display="flex" justifyContent="space-between" alignItems="center" paddingBlockEnd="300" style={{ borderBottom: '1px solid #bbc3c9' }}>
                    <Text variant="headingSm" as="h3">Line 1: 1 limited</Text>
                    <div style={{ color: '#6d7175' }}>⚙️</div>
                </Box>
                <Box paddingTop="300"><Checkbox label="Sku" checked={!!design.line1_sku} onChange={(v) => handleUpdate('line1_sku', v)} /></Box>
            </Card>

            <Card padding="400">
                <Box display="flex" justifyContent="space-between" alignItems="center" paddingBlockEnd="300" style={{ borderBottom: '1px solid #bbc3c9' }}>
                    <Text variant="headingSm" as="h3">Line 2: 4 limited</Text>
                    <div style={{ color: '#6d7175' }}>⚙️</div>
                </Box>
                <BlockStack gap="200" paddingTop="300">
                    <Checkbox label="Name" checked={!!design.line2_name} onChange={(v) => handleUpdate('line2_name', v)} />
                    <Checkbox label="Price" checked={!!design.line2_price} onChange={(v) => handleUpdate('line2_price', v)} />
                    {design.line2_price && (
                        <Box padding="300" style={{ backgroundColor: '#f1f2f4', borderRadius: '4px' }}>
                            <FormLayout><TextField label="Currency Format" value={design.line2_currency_format} onChange={(v) => handleUpdate('line2_currency_format', v)} autoComplete="off" /></FormLayout>
                        </Box>
                    )}
                    <Checkbox label="Variant option 1" checked={!!design.line2_variant_option1} onChange={(v) => handleUpdate('line2_variant_option1', v)} />
                </BlockStack>
            </Card>

            <Card padding="400">
                <Box display="flex" justifyContent="space-between" alignItems="center" paddingBlockEnd="300" style={{ borderBottom: '1px solid #bbc3c9' }}>
                    <Text variant="headingSm" as="h3">Line 3: 4 limited</Text>
                    <div style={{ color: '#6d7175' }}>⚙️</div>
                </Box>
                <Box paddingTop="300"><Checkbox label="Vendor" checked={!!design.line3_vendor} onChange={(v) => handleUpdate('line3_vendor', v)} /></Box>
            </Card>
        </BlockStack>
    );
}

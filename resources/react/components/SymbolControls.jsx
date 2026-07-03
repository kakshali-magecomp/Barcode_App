import React from 'react';
import { Card, FormLayout, TextField, Select, Checkbox, Box, Text, BlockStack } from '@shopify/polaris';

export default function SymbolControls({ design, handleUpdate }) {
    return (
        <Card padding="400">
            <Box display="flex" justifyContent="space-between" alignItems="center" paddingBlockEnd="300" style={{ borderBottom: '1px solid #bbc3c9' }}>
                <Text variant="headingSm" as="h3">Barcode Line: 1 limited</Text>
                <div style={{ color: '#6d7175' }}>⇅</div>
            </Box>
            <BlockStack gap="300" paddingTop="300">
                <Checkbox label="Symbol" checked={!!design.symbol_enabled} onChange={(v) => handleUpdate('symbol_enabled', v)} />
                {design.symbol_enabled && (
                    <FormLayout>
                        <Select label="Type" options={[{label: 'Barcode', value: 'BARCODE'}, {label: 'QR Code', value: 'QR'}]} value={design.symbol_type} onChange={(v) => handleUpdate('symbol_type', v)} />
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Symbol Color</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input type="color" value={design.symbol_color || '#000000'} onChange={(e) => handleUpdate('symbol_color', e.target.value)} style={{ width: '40px', height: '32px', cursor: 'pointer' }} />
                                <TextField value={design.symbol_color} onChange={(v) => handleUpdate('symbol_color', v)} autoComplete="off" />
                            </div>
                        </div>
                        <Select label="Field" options={[
                            {label: 'Barcode Value', value: 'barcode_value'}, {label: 'Product Name', value: 'product_name'}, 
                            {label: 'Product Price', value: 'product_price'}, {label: 'Product Page URL', value: 'product_online_url'}
                        ]} value={design.symbol_field_source} onChange={(v) => handleUpdate('symbol_field_source', v)} />

                        {design.symbol_type === 'BARCODE' ? (
                            <BlockStack gap="300">
                                <Box display="flex" justifyContent="space-between" alignItems="center"><Text as="span">Hide barcode value</Text><input type="checkbox" checked={!!design.hide_barcode_value} onChange={(e) => handleUpdate('hide_barcode_value', e.target.checked)} /></Box>
                                <Select label="Barcode Format" options={[{label: 'Code 128', value: 'CODE128'}, {label: 'Code 39', value: 'CODE39'}]} value={design.symbol_barcode_format} onChange={(v) => handleUpdate('symbol_barcode_format', v)} />
                                <div>
                                    <Box display="flex" justifyContent="space-between" marginBottom="100"><Text as="span">Symbol Font Size</Text><Text fontWeight="bold" as="span">{design.symbol_font_size}</Text></Box>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '12px' }}>4</span><input type="range" min="4" max="80" value={design.symbol_font_size || 12} onChange={(e) => handleUpdate('symbol_font_size', parseInt(e.target.value))} style={{ flexGrow: 1, cursor: 'pointer' }} /><span style={{ fontSize: '12px' }}>80</span></div>
                                </div>
                                <div>
                                    <Box display="flex" justifyContent="space-between" marginBottom="100"><Text as="span">Symbol Bar Width</Text><Text fontWeight="bold" as="span">{design.symbol_bar_width}</Text></Box>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '12px' }}>1</span><input type="range" min="1" max="20" value={design.symbol_bar_width || 2} onChange={(e) => handleUpdate('symbol_bar_width', parseInt(e.target.value))} style={{ flexGrow: 1, cursor: 'pointer' }} /><span style={{ fontSize: '12px' }}>20</span></div>
                                </div>
                                <div>
                                    <Box display="flex" justifyContent="space-between" marginBottom="100"><Text as="span">Symbol Bar Height</Text><Text fontWeight="bold" as="span">{design.symbol_bar_height}</Text></Box>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '12px' }}>10</span><input type="range" min="10" max="300" value={design.symbol_bar_height || 35} onChange={(e) => handleUpdate('symbol_bar_height', parseInt(e.target.value))} style={{ flexGrow: 1, cursor: 'pointer' }} /><span style={{ fontSize: '12px' }}>300</span></div>
                                </div>
                            </BlockStack>
                        ) : (
                            <BlockStack gap="300">
                                <Select label="Dot Type" options={[{ label: 'Square', value: 'square' }, { label: 'Rounded', value: 'rounded' }]} value={design.qr_dot_type} onChange={(v) => handleUpdate('qr_dot_type', v)} />
                                <Select label="Corner Dot Type" options={[{ label: 'Square', value: 'square' }, { label: 'Dots / Circles', value: 'dots' }]} value={design.qr_corner_dot_type} onChange={(v) => handleUpdate('qr_corner_dot_type', v)} />
                                <Select label="Corner Square Type" options={[{ label: 'Square', value: 'square' }, { label: 'Outline Framework', value: 'outline' }]} value={design.qr_corner_square_type} onChange={(v) => handleUpdate('qr_corner_square_type', v)} />
                                <FormLayout.Group>
                                    <TextField label="Width(px)" value={String(design.symbol_width_px || '140')} onChange={(v) => handleUpdate('symbol_width_px', v)} autoComplete="off" />
                                    <TextField label="Margin(px)" value={String(design.symbol_margin_px || '1')} onChange={(v) => handleUpdate('symbol_margin_px', v)} autoComplete="off" />
                                </FormLayout.Group>
                            </BlockStack>
                        )}
                    </FormLayout>
                )}
            </BlockStack>
        </Card>
    );
}

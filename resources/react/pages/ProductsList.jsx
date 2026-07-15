import React, { useState, useEffect } from 'react';
import { Page, Card, IndexTable, Text, Badge, Spinner, Box, Thumbnail, Button } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';

export default function ProductsList() {
    const appBridge = useAppBridge();
    // Use App Bridge fetch to automatically attach shop session headers
    const fetch = appBridge.fetch || window.fetch;

    const [variants, setVariants] = useState([]);
    const [skuRules, setSkuRules] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);

    const fetchProductsAndRules = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch("/api/products", {
                method: "GET",
                headers: { Accept: "application/json" },
            });

            const json = await response.json();

            if (!json?.status) {
                throw new Error(json?.error || "Failed to sync catalog feed channels");
            }

            setVariants(json?.variants ?? []);
            setSkuRules(json?.sku_rules ?? null);
        } catch (err) {
            setError(err.message || "Failed to load products parameters.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductsAndRules();
    }, []);

    const calculateSuggestedSku = (item) => {
        if (!skuRules) return "Formula Missing";

        const delimiter = skuRules.sku_delimiter || '-';
        let segments = [];

        if (skuRules.sku_prefix) segments.push(skuRules.sku_prefix);

        const extractPart = (text, rule) => {
            if (!rule || rule === 'none' || rule === 'disabled') return null;
            if (rule === 'full') return text;
            if (rule === 'char_1') return text.substring(0, 1);
            if (rule === 'char_2') return text.substring(0, 2);
            if (rule === 'char_3') return text.substring(0, 3);
            if (rule === 'char_4') return text.substring(0, 4);
            return null;
        };

        const titlePart = extractPart(item.product_title, skuRules.segment_product_title);
        if (titlePart) segments.push(titlePart);

        const vendorPart = extractPart(item.vendor, skuRules.segment_product_vendor);
        if (vendorPart) segments.push(vendorPart);

        const typePart = extractPart(item.product_type, skuRules.segment_product_type);
        if (typePart) segments.push(typePart);

        const selectedMetafield = skuRules.segment_metafield;
        if (
            selectedMetafield &&
            item.metafields &&
            item.metafields[selectedMetafield]
        ) {
            const metafieldValue = item.metafields[selectedMetafield];
            const metafieldPart = extractPart(
                String(metafieldValue),
                skuRules.segment_metafield_rule
            );
            if (metafieldPart) {
                segments.push(metafieldPart);
            }
        }

        if (!skuRules.hide_options_1_2_3) {
            const opt1Part = extractPart(item.option_1, skuRules.segment_option1);
            if (opt1Part) segments.push(opt1Part);
            const opt2Part = extractPart(item.option_2, skuRules.segment_option2);
            if (opt2Part) segments.push(opt2Part);
            const opt3Part = extractPart(item.option_3, skuRules.segment_option3);
            if (opt3Part) segments.push(opt3Part);
        }

        segments.push(skuRules.sku_auto_number_start || '1001');

        if (skuRules.sku_suffix) segments.push(skuRules.sku_suffix);

        let finalResult = segments.join(delimiter).replace(/\s+/g, '');
        return skuRules.force_uppercase_fields ? finalResult.toUpperCase() : finalResult;
    };

    const handleSelectionChange = (selectionType, isChecked, id) => {
        if (selectionType === 'all') {
            setSelectedItems(isChecked ? variants.map((v) => v.variant_id) : []);
        } else {
            setSelectedItems((prev) =>
                isChecked ? [...prev, id] : prev.filter((item) => item !== id)
            );
        }
    };

    const handleBulkSkuSync = async () => {
        try {
            setLoading(true);
            setError("");

            const itemsToUpdate = variants
                .filter(item => selectedItems.includes(item.variant_id))
                .map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    inventory_item_id: item.inventory_item_id,
                    suggested_sku: calculateSuggestedSku(item),
                }));
            console.log(itemsToUpdate);

            if (itemsToUpdate.length === 0) return;

            const response = await fetch("/api/products/bulk-update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ variants: itemsToUpdate })
            });

            const json = await response.json();

            if (json.status === 1) {
                setSelectedItems([]);
                await fetchProductsAndRules();
                if (appBridge && appBridge.toast) {
                    appBridge.toast.show("Store variant SKUs synchronized successfully!");
                }
            } else {
                throw new Error(json.error || "Failed to push variation updates.");
            }
        } catch (err) {
            setError(err.message || "A transaction error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const resourceName = { singular: 'variant', plural: 'variants' };
    const allResourcesSelected = variants.length > 0 && selectedItems.length === variants.length;

    const rowMarkup = variants.map((item, index) => {
        const isSelected = selectedItems.includes(item.variant_id);
        const suggestedSku = calculateSuggestedSku(item);
        const thumbnailSrc = item.image || '';

        return (
            <IndexTable.Row
                id={item.variant_id}
                key={item.variant_id}
                position={index}
                selected={isSelected}
            >
                <IndexTable.Cell>
                    {thumbnailSrc ? (
                        <Thumbnail source={thumbnailSrc} alt={item.product_title} size="small" />
                    ) : (
                        <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f1f1', borderRadius: '4px' }} />
                    )}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text fontWeight="bold" as="span">{item.product_title}</Text>
                    {item.variant_title && item.variant_title !== 'Default Title' && (
                        <Box color="text-secondary" as="span"> — {item.variant_title}</Box>
                    )}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    {item.current_sku ? <Badge tone="info">{item.current_sku}</Badge> : <Text tone="subdued" as="span">None</Text>}
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text fontWeight="bold" tone="success" as="span">{suggestedSku}</Text>
                </IndexTable.Cell>
                <IndexTable.Cell>
                    <Text as="span" fontWeight="bold">${item.price}</Text>
                </IndexTable.Cell>
            </IndexTable.Row>
        );
    });

    if (loading) {
        return (
            <Box padding="1200" align="center">
                <Spinner accessibilityLabel="Syncing data structures" size="large" />
                <Box marginTop="400"><Text as="p">Loading Product Variants & Pattern Formulas...</Text></Box>
            </Box>
        );
    }

    return (
        <Page title="Inventory SKU Management">
            {selectedItems.length > 0 && (
                <Box paddingBlockEnd="400">
                    <Card padding="400">
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap="400" style={{ flexWrap: "wrap", }}>
                            <Text as="p" variant="bodyMd" fontWeight="medium" tone="subdued" >
                                {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} queued for processing
                            </Text>
                            <Button variant="primary" size="large" onClick={handleBulkSkuSync}>
                                Generate & Sync SKUs to Shopify
                            </Button>
                        </Box>
                    </Card>
                </Box>
            )}

            <Card padding="0">
                {error ? (
                    <Box padding="500"><Text tone="critical" as="p">{error}</Text></Box>
                ) : (
                    <IndexTable
                        resourceName={resourceName}
                        itemCount={variants.length}
                        selectedItemsCount={allResourcesSelected ? 'All' : selectedItems.length}
                        onSelectionChange={handleSelectionChange}
                        headings={[
                            { title: 'Image' },
                            { title: 'Product Variant' },
                            { title: 'Current Store SKU' },
                            { title: 'Suggested Pattern SKU (New)' },
                            { title: 'Price' },
                        ]}
                    >
                        {rowMarkup}
                    </IndexTable>
                )}
            </Card>
        </Page>
    );
}

import React from "react";
import {
    Card,
    Box,
    Text,
    Button,
    InlineStack,
} from "@shopify/polaris";

export default function BarcodeToolbar({
    selectedCount,
    onGenerate,
    onSave,
    generating = false,
    saving = false,
}) {

    if (selectedCount === 0) return null;

    return (
        <Box paddingBlockEnd="400">
            <Card padding="400">

                <InlineStack
                    align="space-between"
                    blockAlign="center"
                >

                    <Text as="p" variant="bodyMd">
                        {selectedCount} product
                        {selectedCount > 1 ? "s" : ""} selected
                    </Text>

                    <InlineStack gap="300">

                        <Button
                            variant="primary"
                            loading={generating}
                            onClick={onGenerate}
                        >
                            Generate Barcode
                        </Button>

                        <Button
                            tone="success"
                            loading={saving}
                            onClick={onSave}
                        >
                            Save to Shopify
                        </Button>

                    </InlineStack>

                </InlineStack>

            </Card>
        </Box>
    );
}
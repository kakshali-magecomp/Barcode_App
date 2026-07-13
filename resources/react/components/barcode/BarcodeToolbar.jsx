import { Card, Box, Text, Button } from "@shopify/polaris";
import React from "react";
export default function BarcodeToolbar({
    selectedCount,
    onGenerate,
}) {
    if (selectedCount === 0) return null;

    return (
        <Box paddingBlockEnd="400">
            <Card padding="400">
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    style={{ flexWrap: "wrap" }}
                >
                    <Text>
                        {selectedCount} product
                        {selectedCount > 1 ? "s" : ""} selected
                    </Text>

                    <Button
                        variant="primary"
                        onClick={() => {
                            console.log("BUTTON CLICKED");
                            console.log("onGenerate =", onGenerate);

                            if (typeof onGenerate === "function") {
                                onGenerate();
                            } else {
                                console.error("onGenerate is not a function");
                            }
                        }}
                    >
                        Generate Barcode
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}
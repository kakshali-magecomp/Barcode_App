import React from "react";
import {
  Card,
  Box,
  Button,
  InlineStack,
} from "@shopify/polaris";

export default function ActionButtons({
  loading,
  generateBarcode,
  setPreviewOpen,
}) {
  return (
    <Card>
      <Box padding="500">
        <InlineStack gap="300">

          <Button
            variant="primary"
            loading={loading}
            onClick={generateBarcode}
          >
            Save History
          </Button>

          <Button
            onClick={() => setPreviewOpen(true)}
          >
            Print Preview
          </Button>

          <Button tone="success">
            Generate & Print
          </Button>

        </InlineStack>
      </Box>
    </Card>
  );
}
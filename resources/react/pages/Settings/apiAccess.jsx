import React from "react";
import {
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  Banner,
  InlineStack,
} from "@shopify/polaris";

export default function ApiAccess() {
  const apiKey = "app_xxxxxxxxxxxxxxxxxxxxx";
  const apiSecret = "************************";
  const webhookUrl =
    "https://your-app-domain.com/api/webhooks";
  const apiVersion = "2025-10";

  return (
    <BlockStack gap="500">
      <Text variant="headingLg" as="h2">
        API Access
      </Text>

      <Banner tone="info">
        API credentials are used to connect external systems
        with your Barcode Labels application.
      </Banner>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <TextField
              label="API Key"
              value={apiKey}
              autoComplete="off"
              readOnly
            />

            <TextField
              label="API Secret"
              value={apiSecret}
              autoComplete="off"
              readOnly
              type="password"
            />

            <TextField
              label="Webhook URL"
              value={webhookUrl}
              autoComplete="off"
              readOnly
            />

            <TextField
              label="API Version"
              value={apiVersion}
              autoComplete="off"
              readOnly
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Store Information
            </Text>

            <Text as="p">
              Store URL
            </Text>

            <TextField
              value="your-store.myshopify.com"
              autoComplete="off"
              readOnly
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <InlineStack align="space-between">
            <Text variant="headingMd">
              Security
            </Text>

            <Button
              variant="primary"
              tone="critical"
            >
              Regenerate API Key
            </Button>
          </InlineStack>

          <div style={{ marginTop: "12px" }}>
            <Text tone="subdued">
              Regenerating your API key will invalidate
              existing integrations using the current key.
            </Text>
          </div>
        </div>
      </Card>
    </BlockStack>
  );
}
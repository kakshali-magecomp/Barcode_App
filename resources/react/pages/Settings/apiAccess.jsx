import React from "react";
import {
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  Banner,
  InlineStack,
  Divider,
} from "@shopify/polaris";

export default function ApiAccess({
  settings,
  updateSetting,
}) {
  const regenerateApiKey = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let key = "app_";

    for (let i = 0; i < 32; i++) {
      key += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    updateSetting("api_key", key);
  };

  return (
    <BlockStack gap="500">
      <Text variant="headingLg" as="h2">
        API Access
      </Text>

      <Banner tone="info">
        Manage API credentials used by external applications,
        integrations and custom services.
      </Banner>

      {/* API Credentials */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              API Credentials
            </Text>

            <TextField
              label="API Key"
              value={settings.api_key || ""}
              onChange={(value) =>
                updateSetting("api_key", value)
              }
              autoComplete="off"
              helpText="Used to authenticate external API requests."
            />

            <TextField
              label="API Secret"
              value="••••••••••••••••••••••••••••"
              readOnly
              autoComplete="off"
              helpText="For security reasons the secret cannot be viewed."
            />

            <TextField
              label="Webhook URL"
              value={`${window.location.origin}/api/webhooks`}
              readOnly
              autoComplete="off"
            />

            <TextField
              label="API Version"
              value="2025-10"
              readOnly
              autoComplete="off"
            />
          </BlockStack>
        </div>
      </Card>

      {/* Store Information */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h3">
              Store Information
            </Text>

            <TextField
              label="Store Domain"
              value={window.location.hostname}
              readOnly
              autoComplete="off"
            />

            <TextField
              label="App URL"
              value={window.location.origin}
              readOnly
              autoComplete="off"
            />
          </BlockStack>
        </div>
      </Card>

      {/* Security */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <InlineStack
              align="space-between"
              blockAlign="center"
            >
              <Text variant="headingMd" as="h3">
                Security
              </Text>

              <Button
                variant="primary"
                tone="critical"
                onClick={regenerateApiKey}
              >
                Regenerate API Key
              </Button>
            </InlineStack>

            <Divider />

            <Text tone="subdued" as="p">
              Regenerating the API key will invalidate all
              existing integrations using the previous key.
            </Text>

            <Text tone="subdued" as="p">
              After generating a new key, click the
              <strong> Save Settings </strong>
              button at the bottom of the Settings page to
              permanently save the new API key.
            </Text>
          </BlockStack>
        </div>
      </Card>
    </BlockStack>
  );
}
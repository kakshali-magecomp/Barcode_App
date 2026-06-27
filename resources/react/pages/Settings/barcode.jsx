import React from "react";
import {
  Card,
  Text,
  Checkbox,
  Button,
  BlockStack,
  Banner,
  Select,
  TextField,
} from "@shopify/polaris";

export default function Barcode({
  settings,
  updateSetting,
  saveSettings,
  loading,
}) {
  return (
    <BlockStack gap="500">
      <Text variant="headingLg" as="h2">
        Barcode Settings
      </Text>

      <Banner tone="info">
        Configure automatic barcode generation and barcode
        display settings.
      </Banner>

      {/* Auto Generation */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <Checkbox
              label="Auto generate barcode after creating product"
              checked={settings.auto_generate_barcode}
              onChange={(value) =>
                updateSetting("auto_generate_barcode", value)
              }
            />

            <Checkbox
              label="Auto detect GTIN format"
              checked={settings.auto_detect_gtin}
              onChange={(value) =>
                updateSetting("auto_detect_gtin", value)
              }
            />

            <Checkbox
              label="Generate barcode without leading zero"
              checked={settings.allow_non_zero}
              onChange={(value) =>
                updateSetting("allow_non_zero", value)
              }
            />
          </BlockStack>
        </div>
      </Card>

      {/* Barcode */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <Text variant="headingMd">
              Barcode Format
            </Text>

            <Select
              label="Barcode Type"
              value={settings.barcode_type}
              onChange={(value) =>
                updateSetting("barcode_type", value)
              }
              options={[
                {
                  label: "CODE128",
                  value: "CODE128",
                },
                {
                  label: "EAN13",
                  value: "EAN13",
                },
                {
                  label: "EAN8",
                  value: "EAN8",
                },
                {
                  label: "UPC",
                  value: "UPC",
                },
                {
                  label: "CODE39",
                  value: "CODE39",
                },
              ]}
            />

            <Checkbox
              label="Show Human Readable Text"
              checked={settings.show_human_text}
              onChange={(value) =>
                updateSetting("show_human_text", value)
              }
            />

            <TextField
              label="Barcode Pattern"
              value={settings.barcode_pattern || ""}
              onChange={(value) =>
                updateSetting("barcode_pattern", value)
              }
              autoComplete="off"
              helpText="Example : [N.8][N.8]"
            />

            <TextField
              label="Contextual Pricing Country"
              value={settings.country_code || ""}
              onChange={(value) =>
                updateSetting("country_code", value)
              }
              autoComplete="off"
              helpText="Example : US, IN, UK"
            />
          </BlockStack>
        </div>
      </Card>

      {/* Examples */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="200">
            <Text variant="headingMd">
              Barcode Pattern Examples
            </Text>

            <Text>[N.8] → 12345678</Text>
            <Text>[N.4] → 1234</Text>
            <Text>[A.6] → ABCDEF</Text>
            <Text>[AN.8] → A1B2C3D4</Text>
          </BlockStack>
        </div>
      </Card>

      {/* Shopify Flow */}

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="300">
            <Text variant="headingMd">
              Shopify Flow Integration
            </Text>

            <Text tone="subdued">
              Automatically generate missing barcodes using
              Shopify Flow.
            </Text>
          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        loading={loading}
        onClick={saveSettings}
      >
        Save Barcode Settings
      </Button>
    </BlockStack>
  );
}
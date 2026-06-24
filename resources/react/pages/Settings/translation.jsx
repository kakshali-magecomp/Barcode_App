import React, { useState } from "react";
import {
  Card,
  Text,
  Select,
  Checkbox,
  Button,
  BlockStack,
  Banner,
  TextField,
} from "@shopify/polaris";

export default function Translation() {
  const [language, setLanguage] = useState("en");
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [showBarcodeText, setShowBarcodeText] = useState(true);

  return (
    <BlockStack gap="500">

      <Text variant="headingLg" as="h2">
        Translation Settings
      </Text>

      <Banner tone="info">
        Configure language preferences for barcode labels,
        templates, printing pages, and application content.
      </Banner>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Select
              label="Default Language"
              options={[
                { label: "English", value: "en" },
                { label: "Hindi", value: "hi" },
                { label: "German", value: "de" },
                { label: "Spanish", value: "es" },
                { label: "Italian", value: "it" },
                { label: "Portuguese", value: "pt" },
                { label: "Japanese", value: "ja" },
                { label: "Chinese", value: "zh" },
                { label: "French", value: "fr" },
              ]}
              value={language}
              onChange={setLanguage}
            />

            <Checkbox
              label="Enable automatic translations"
              checked={autoTranslate}
              onChange={setAutoTranslate}
            />

            <Checkbox
              label="Display translated text on labels"
              checked={showBarcodeText}
              onChange={setShowBarcodeText}
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              Custom Label Text
            </Text>

            <TextField
              label="Barcode Text"
              value="Barcode"
              autoComplete="off"
            />

            <TextField
              label="SKU Text"
              value="SKU"
              autoComplete="off"
            />

            <TextField
              label="Price Text"
              value="Price"
              autoComplete="off"
            />

            <TextField
              label="Product Text"
              value="Product"
              autoComplete="off"
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Supported Languages
            </Text>

            <Text tone="subdued">
              ✓ English
            </Text>

            <Text tone="subdued">
              ✓ Hindi
            </Text>

            <Text tone="subdued">
              ✓ German
            </Text>

            <Text tone="subdued">
              ✓ Spanish
            </Text>

            <Text tone="subdued">
              ✓ Portuguese
            </Text>

            <Text tone="subdued">
              ✓ Japanese
            </Text>

            <Text tone="subdued">
              ✓ Chinese
            </Text>

            <Text tone="subdued">
              ✓ French
            </Text>

          </BlockStack>
        </div>
      </Card>

      <Button variant="primary">
        Save Translation Settings
      </Button>

    </BlockStack>
  );
}
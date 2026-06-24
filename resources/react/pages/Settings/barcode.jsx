import React, { useState } from "react";
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

export default function Barcode() {
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [autoDetectGTIN, setAutoDetectGTIN] = useState(true);
  const [allowNonZero, setAllowNonZero] = useState(false);

  const [barcodeFormat, setBarcodeFormat] = useState("code128");
  const [barcodePattern, setBarcodePattern] = useState("[N.8][N.8]");
  const [contextualPricing, setContextualPricing] = useState("US");

  const handleSave = () => {
    console.log({
      autoGenerate,
      autoDetectGTIN,
      allowNonZero,
      barcodeFormat,
      barcodePattern,
      contextualPricing,
    });

    // Save API Call Here
  };

  return (
    <BlockStack gap="500">

      <Text variant="headingLg" as="h2">
        Barcode Settings
      </Text>

      <Banner tone="info">
        Configure automatic barcode generation and barcode formats for your products.
      </Banner>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Checkbox
              label="Auto generate barcode after create new product"
              checked={autoGenerate}
              onChange={setAutoGenerate}
            />

            <Checkbox
              label="Auto detect barcode GTIN format and render correct symbol"
              checked={autoDetectGTIN}
              onChange={setAutoDetectGTIN}
            />

            <Checkbox
              label="Generate barcodes that do not begin or end with zero"
              checked={allowNonZero}
              onChange={setAllowNonZero}
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              Barcode Format
            </Text>

            <Select
              label="Barcode Format"
              value={barcodeFormat}
              onChange={setBarcodeFormat}
              options={[
                {
                  label: "Code 128",
                  value: "code128",
                },
                {
                  label: "EAN-13",
                  value: "ean13",
                },
                {
                  label: "UPC-A",
                  value: "upca",
                },
                {
                  label: "EAN-8",
                  value: "ean8",
                },
              ]}
            />

            <TextField
              label="Barcode Pattern"
              value={barcodePattern}
              onChange={setBarcodePattern}
              autoComplete="off"
              helpText="Example: [N.8][N.8] = 16 numeric digits"
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              Contextual Pricing Value
            </Text>

            <TextField
              label="Country Code"
              value={contextualPricing}
              onChange={setContextualPricing}
              autoComplete="off"
              helpText="Example: US, IN, UA, VN"
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

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

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Shopify Flow Integration
            </Text>

            <Text tone="subdued">
              Use Shopify Flow actions to automatically generate
              barcodes for products or variants that do not have
              barcode values yet.
            </Text>

            <Text tone="subdued">
              This feature is available in the Pro Plan.
            </Text>

          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        onClick={handleSave}
      >
        Save Barcode Settings
      </Button>

    </BlockStack>
  );
}
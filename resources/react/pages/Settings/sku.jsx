import React, { useState } from "react";
import {
  Card,
  Text,
  TextField,
  Checkbox,
  Button,
  BlockStack,
  Banner,
  Select,
} from "@shopify/polaris";

export default function Sku() {
  const [autoGenerateSku, setAutoGenerateSku] = useState(true);
  const [skuPattern, setSkuPattern] = useState("SKU-[N.6]");
  const [skuPrefix, setSkuPrefix] = useState("SKU");
  const [skuSuffix, setSkuSuffix] = useState("");
  const [skuLength, setSkuLength] = useState("6");
  const [skuType, setSkuType] = useState("numeric");

  const handleSave = () => {
    console.log({
      autoGenerateSku,
      skuPattern,
      skuPrefix,
      skuSuffix,
      skuLength,
      skuType,
    });

    // Save API Call Here
  };

  return (
    <BlockStack gap="500">

      <Text variant="headingLg" as="h2">
        SKU Settings
      </Text>

      <Banner tone="info">
        Configure automatic SKU generation for your Shopify products and variants.
      </Banner>

      {/* SKU Generation */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              SKU Generation
            </Text>

            <Checkbox
              label="Automatically generate SKU for new products"
              checked={autoGenerateSku}
              onChange={setAutoGenerateSku}
            />

            <Select
              label="SKU Type"
              options={[
                { label: "Numeric", value: "numeric" },
                { label: "Alphabetic", value: "alphabetic" },
                { label: "Alphanumeric", value: "alphanumeric" },
              ]}
              value={skuType}
              onChange={setSkuType}
            />

            <TextField
              label="SKU Length"
              value={skuLength}
              onChange={setSkuLength}
              autoComplete="off"
            />

          </BlockStack>
        </div>
      </Card>

      {/* SKU Pattern */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              SKU Pattern
            </Text>

            <TextField
              label="SKU Prefix"
              value={skuPrefix}
              onChange={setSkuPrefix}
              autoComplete="off"
            />

            <TextField
              label="SKU Suffix"
              value={skuSuffix}
              onChange={setSkuSuffix}
              autoComplete="off"
            />

            <TextField
              label="SKU Pattern"
              value={skuPattern}
              onChange={setSkuPattern}
              autoComplete="off"
              helpText="Example: SKU-[N.6] = SKU-123456"
            />

          </BlockStack>
        </div>
      </Card>

      {/* Examples */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Pattern Examples
            </Text>

            <Text>[N.6] → 123456</Text>
            <Text>[A.6] → ABCDEF</Text>
            <Text>[AN.8] → A1B2C3D4</Text>
            <Text>SKU-[N.6] → SKU-123456</Text>
            <Text>PROD-[AN.8] → PROD-A1B2C3D4</Text>

          </BlockStack>
        </div>
      </Card>

      {/* Information */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Information
            </Text>

            <Text tone="subdued">
              SKU values help identify products and variants in inventory,
              fulfillment, and reporting systems.
            </Text>

            <Text tone="subdued">
              Existing SKU values will not be overwritten unless you manually regenerate them.
            </Text>

          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        onClick={handleSave}
      >
        Save SKU Settings
      </Button>

    </BlockStack>
  );
}
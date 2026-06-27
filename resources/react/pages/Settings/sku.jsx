import React, { useEffect, useState } from "react";
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
import { useAppBridge } from "@shopify/app-bridge-react";

export default function Sku() {
  const shopify = useAppBridge();

  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    auto_generate_sku: false,
    sku_type: "numeric",
    sku_length: 6,
    sku_prefix: "",
    sku_suffix: "",
    sku_pattern: "SKU-[N.6]",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const result = await response.json();

      if (result.success) {
        setSettings({
          auto_generate_sku:
            result.data.auto_generate_sku ?? false,

          sku_type:
            result.data.sku_type ?? "numeric",

          sku_length:
            result.data.sku_length ?? 6,

          sku_prefix:
            result.data.sku_prefix ?? "",

          sku_suffix:
            result.data.sku_suffix ?? "",

          sku_pattern:
            result.data.sku_pattern ?? "SKU-[N.6]",
        });
      }
    } catch (error) {
      console.error(error);

      shopify.toast.show("Unable to load settings", {
        isError: true,
      });
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      shopify.toast.show("SKU settings saved successfully");
    } catch (error) {
      console.error(error);

      shopify.toast.show(
        error.message || "Unable to save settings",
        {
          isError: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BlockStack gap="500">

      <Text variant="headingLg" as="h2">
        SKU Settings
      </Text>

      <Banner tone="info">
        Configure automatic SKU generation for your Shopify
        products and variants.
      </Banner>

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">

            <Text variant="headingMd" as="h3">
              SKU Generation
            </Text>

            <Checkbox
              label="Automatically generate SKU for new products"
              checked={settings.auto_generate_sku}
              onChange={(value) =>
                handleChange(
                  "auto_generate_sku",
                  value
                )
              }
            />

            <Select
              label="SKU Type"
              value={settings.sku_type}
              onChange={(value) =>
                handleChange("sku_type", value)
              }
              options={[
                {
                  label: "Numeric",
                  value: "numeric",
                },
                {
                  label: "Alphabetic",
                  value: "alphabetic",
                },
                {
                  label: "Alphanumeric",
                  value: "alphanumeric",
                },
              ]}
            />

            <TextField
              label="SKU Length"
              type="number"
              value={String(settings.sku_length)}
              onChange={(value) =>
                handleChange(
                  "sku_length",
                  Number(value)
                )
              }
              autoComplete="off"
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">

            <Text variant="headingMd" as="h3">
              SKU Pattern
            </Text>

            <TextField
              label="SKU Prefix"
              value={settings.sku_prefix}
              onChange={(value) =>
                handleChange(
                  "sku_prefix",
                  value
                )
              }
              autoComplete="off"
            />

            <TextField
              label="SKU Suffix"
              value={settings.sku_suffix}
              onChange={(value) =>
                handleChange(
                  "sku_suffix",
                  value
                )
              }
              autoComplete="off"
            />

            <TextField
              label="SKU Pattern"
              value={settings.sku_pattern}
              onChange={(value) =>
                handleChange(
                  "sku_pattern",
                  value
                )
              }
              autoComplete="off"
              helpText="Example: SKU-[N.6]"
            />

          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="300">

            <Text variant="headingMd" as="h3">
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

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="300">

            <Text variant="headingMd" as="h3">
              Information
            </Text>

            <Text tone="subdued" as="p">
              SKU values help identify products and variants
              across inventory, fulfillment, and reporting
              systems.
            </Text>

            <Text tone="subdued" as="p">
              Existing SKU values will not be overwritten
              unless you regenerate them manually.
            </Text>

          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        loading={loading}
        onClick={handleSave}
      >
        Save SKU Settings
      </Button>

    </BlockStack>
  );
}
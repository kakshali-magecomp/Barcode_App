import React from "react";
import {
  Card,
  BlockStack,
  RadioButton,
  Text,
  Box,
} from "@shopify/polaris";

export default function MethodSelector({
  method,
  setMethod,
  generateOption,
  setGenerateOption,
}) {
  return (
    <Card>
      <Box padding="500">

        <BlockStack gap="500">

          <Text variant="headingMd" as="h2">
            1. Select method to generate barcode
          </Text>

          {/* Generate Barcode */}
          <RadioButton
            label="Only Generate Barcode"
            checked={method === "generate_barcode"}
            id="generate_barcode"
            name="method"
            onChange={() =>
              setMethod("generate_barcode")
            }
          />

          {method === "generate_barcode" && (
            <Box
              background="bg-surface-secondary"
              padding="400"
              borderRadius="300"
            >
              <BlockStack gap="300">

                <RadioButton
                  label="Generate barcode only if barcode is empty"
                  checked={generateOption === "empty"}
                  id="empty"
                  name="generate-option"
                  onChange={() =>
                    setGenerateOption("empty")
                  }
                />

                <RadioButton
                  label="Replace existing barcode"
                  checked={generateOption === "replace"}
                  id="replace"
                  name="generate-option"
                  onChange={() =>
                    setGenerateOption("replace")
                  }
                />

                <RadioButton
                  label="Generate barcode from SKU"
                  checked={generateOption === "sku"}
                  id="sku"
                  name="generate-option"
                  onChange={() =>
                    setGenerateOption("sku")
                  }
                />

              </BlockStack>
            </Box>
          )}

          {/* Generate SKU */}

          <RadioButton
            label="Only Generate SKU"
            checked={method === "generate_sku"}
            id="generate_sku"
            name="method"
            onChange={() =>
              setMethod("generate_sku")
            }
          />

          {/* Print */}

          <RadioButton
            label="Only Print Labels"
            checked={method === "print"}
            id="print"
            name="method"
            onChange={() =>
              setMethod("print")
            }
          />

          {/* Generate + Print */}

          <RadioButton
            label="Generate Barcode & Print Labels"
            checked={method === "generate_print"}
            id="generate_print"
            name="method"
            onChange={() =>
              setMethod("generate_print")
            }
          />

        </BlockStack>

      </Box>
    </Card>
  );
}
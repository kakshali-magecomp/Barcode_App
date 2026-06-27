import React from "react";
import {
  Card,
 Button,
 Thumbnail,
 Text,
 BlockStack,
 InlineStack,
 Box,
} from "@shopify/polaris";

export default function ProductSelector({
  products,
  chooseProducts,
  removeProduct,
}) {
  return (
    <Card>
      <Box padding="500">

        <BlockStack gap="500">

          <Text variant="headingMd" as="h2">
            2. Select Product(s)
          </Text>

          <Button
            variant="primary"
            onClick={chooseProducts}
          >
            Choose Products
          </Button>

          {products.length === 0 && (
            <Text tone="subdued">
              No products selected
            </Text>
          )}

          {products.map((product) => {

            const image =
              product.images?.[0]?.originalSrc ||
              product.images?.[0]?.src ||
              "";

            const variant =
              product.variants?.[0] || {};

            return (
              <Card key={product.id}>
                <Box padding="400">

                  <InlineStack
                    align="space-between"
                    blockAlign="center"
                  >

                    <InlineStack gap="400">

                      <Thumbnail
                        source={image}
                        alt={product.title}
                        size="large"
                      />

                      <BlockStack gap="100">

                        <Text
                          variant="headingSm"
                          as="h3"
                        >
                          {product.title}
                        </Text>

                        <Text tone="subdued">
                          Vendor : {product.vendor || "-"}
                        </Text>

                        <Text tone="subdued">
                          SKU : {variant.sku || "-"}
                        </Text>

                        <Text tone="subdued">
                          Barcode : {variant.barcode || "-"}
                        </Text>

                        <Text tone="subdued">
                          Variant : {variant.title || "-"}
                        </Text>

                      </BlockStack>

                    </InlineStack>

                    <Button
                      tone="critical"
                      onClick={() =>
                        removeProduct(product.id)
                      }
                    >
                      Remove
                    </Button>

                  </InlineStack>

                </Box>
              </Card>
            );
          })}

        </BlockStack>

      </Box>
    </Card>
  );
}
import React from "react";
import {
  Card,
  Box,
  BlockStack,
  InlineStack,
  Text,
} from "@shopify/polaris";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";

export default function LabelPreview({
  template,
  product,
}) {
  if (!template || !product) {
    return (
      <Card>
        <Box padding="500">
          <Text>Select template and product</Text>
        </Box>
      </Card>
    );
  }

  const variant = product.variants?.[0] || {};

  const width = Number(template.label_width || 60);
  const height = Number(template.label_height || 40);

  const image =
    product.images?.[0]?.originalSrc ||
    product.images?.[0]?.src ||
    "";

  return (
    <Card>
      <Box padding="500">

        <Text variant="headingMd">
          Live Preview
        </Text>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
          }}
        >

          <div
            style={{
              width: width * 4,
              minHeight: height * 4,
              border: "1px solid #dfe3e8",
              padding: 12,
              background: "#fff",
              borderRadius: 8,
            }}
          >

            <BlockStack gap="200">

              {image && (
                <img
                  src={image}
                  alt=""
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: "cover",
                    margin: "0 auto",
                  }}
                />
              )}

              <Text
                alignment="center"
                variant="headingSm"
              >
                {product.title}
              </Text>

              <Text alignment="center">
                SKU : {variant.sku || "-"}
              </Text>

              <Text alignment="center">
                Price : ${variant.price || "-"}
              </Text>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Barcode
                  value={
                    variant.barcode ||
                    variant.sku ||
                    "123456"
                  }
                  width={1.4}
                  height={45}
                  fontSize={12}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <QRCode
                  value={`https://yourstore.com/products/${product.handle}`}
                  size={70}
                />
              </div>

            </BlockStack>

          </div>

        </div>

      </Box>
    </Card>
  );
}
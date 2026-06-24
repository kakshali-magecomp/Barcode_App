import React from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  Badge,
  BlockStack,
  InlineStack,
  Icon,
} from "@shopify/polaris";
import { LabelPrinterIcon } from "@shopify/polaris-icons";

export default function GetMoreLabel() {
  const packages = [
    {
      id: 1,
      labels: "5,000 Labels",
      price: "$4.99",
      popular: false,
    },
    {
      id: 2,
      labels: "10,000 Labels",
      price: "$8.99",
      popular: true,
    },
    {
      id: 3,
      labels: "25,000 Labels",
      price: "$19.99",
      popular: false,
    },
    {
      id: 4,
      labels: "50,000 Labels",
      price: "$34.99",
      popular: false,
    },
  ];

  return (
    <Page
      title="Get More Labels"
      subtitle="Purchase additional labels whenever you need them."
    >
      <Layout>
        <Layout.Section>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: "20px",
            }}
          >
            {packages.map((pkg) => (
              <Card key={pkg.id}>
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  {/* Header */}

                  <div
                    style={{
                      background:
                        "linear-gradient(135deg,#4f46e5,#7c3aed)",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "20px",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <Icon
                        source={LabelPrinterIcon}
                        tone="base"
                      />
                    </div>

                    <Text
                      as="h2"
                      variant="headingLg"
                      tone="text-inverse"
                    >
                      LABEL PACKAGE
                    </Text>

                    {pkg.popular && (
                      <div style={{ marginTop: "10px" }}>
                        <Badge tone="attention">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Labels */}

                  <Text
                    variant="heading2xl"
                    as="h3"
                  >
                    {pkg.labels}
                  </Text>

                  <div style={{ marginTop: "10px" }}>
                    <Text
                      variant="heading3xl"
                      as="p"
                    >
                      {pkg.price}
                    </Text>
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <BlockStack gap="200">

                      <Text as="p">
                        ✓ Instant Activation
                      </Text>

                      <Text as="p">
                        ✓ Never Expire
                      </Text>

                      <Text as="p">
                        ✓ Bulk Barcode Printing
                      </Text>

                      <Text as="p">
                        ✓ Works with All Templates
                      </Text>

                    </BlockStack>
                  </div>

                  <div style={{ marginTop: "25px" }}>
                    <Button
                      variant="primary"
                      size="large"
                      fullWidth
                      onClick={() =>
                        console.log("Buy", pkg.labels)
                      }
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </Layout.Section>

        {/* Information Card */}

        <Layout.Section>
          <Card>
            <div style={{ padding: "24px" }}>
              <BlockStack gap="300">

                <Text variant="headingLg" as="h2">
                  Why Buy More Labels?
                </Text>

                <Text as="p">
                  When your free monthly labels run out, you can
                  instantly purchase additional label packages.
                </Text>

                <Text as="p">
                  Purchased labels never expire and can be used
                  anytime for barcode generation and label printing.
                </Text>

                <InlineStack gap="300">
                  <Badge tone="success">
                    Instant Delivery
                  </Badge>

                  <Badge tone="info">
                    No Expiry
                  </Badge>

                  <Badge tone="attention">
                    One-Time Purchase
                  </Badge>
                </InlineStack>

              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}
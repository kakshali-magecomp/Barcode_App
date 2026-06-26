import React, { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  InlineGrid,
  Box,
  BlockStack,
  InlineStack,
  Badge,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    templates: 0,
    generated_barcodes: 0,
    printed_labels: 0,
    current_plan: "Free",
  });

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setStats(
          data?.stats ?? {
            templates: 0,
            generated_barcodes: 0,
            printed_labels: 0,
            current_plan: "Free",
          }
        );
      })
      .catch(console.error);
  }, []);

  return (
    <Page title="Dashboard">

      <Layout>

        {/* Hero Banner */}

        <Layout.Section>
          <Card>
            <div
              style={{
                padding: 40,
                borderRadius: 18,
                background:
                  "linear-gradient(135deg,#4338CA,#7C3AED,#DB2777)",
                color: "#fff",
              }}
            >
              <BlockStack gap="500">

                <Badge tone="success">
                  Barcode & Label Manager
                </Badge>

                <Text
                  variant="heading2xl"
                  as="h1"
                  tone="inherit"
                >
                  Welcome 👋
                </Text>

                <Text variant="bodyLg" as="p" tone="inherit">
                  Easily generate professional barcodes, print labels,
                  manage templates and organize your products from one
                  dashboard.
                </Text>

                <InlineStack gap="300">

                  
                  <Button
                    onClick={() =>
                      navigate("/Generateprint")
                    }
                  >
                    Generate Labels
                  </Button>

                </InlineStack>

              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Statistics */}

        <Layout.Section>
          <InlineGrid columns={4} gap="400">

            <Card roundedAbove="sm">
              <div style={{ padding: 20 }}>
                <Text tone="subdued">
                  Templates
                </Text>

                <Text variant="heading2xl">
                  {stats.templates}
                </Text>

                <Text tone="success">
                  Ready to use
                </Text>
              </div>
            </Card>

            <Card roundedAbove="sm">
              <div style={{ padding: 20 }}>
                <Text tone="subdued">
                  Generated
                </Text>

                <Text variant="heading2xl">
                  {stats.generated_barcodes}
                </Text>

                <Text tone="magic">
                  Barcodes
                </Text>
              </div>
            </Card>

            <Card roundedAbove="sm">
              <div style={{ padding: 20 }}>
                <Text tone="subdued">
                  Printed
                </Text>

                <Text variant="heading2xl">
                  {stats.printed_labels}
                </Text>

                <Text tone="success">
                  Labels
                </Text>
              </div>
            </Card>

            <Card roundedAbove="sm">
              <div style={{ padding: 20 }}>
                <Text tone="subdued">
                  Current Plan
                </Text>

                <Text variant="headingLg">
                  {stats.current_plan}
                </Text>

                <Badge tone="info">
                  Active
                </Badge>
              </div>
            </Card>

          </InlineGrid>
        </Layout.Section>

        {/* Quick Actions */}

        <Layout.Section>
          <Card>

            <div style={{ padding: 25 }}>

              <BlockStack gap="500">

                <Text variant="headingLg">
                  Quick Actions
                </Text>

                <InlineGrid columns={4} gap="300">

                  <Button
                    fullWidth
                    variant="primary"
                    onClick={() =>
                      navigate("/Templateslist")
                    }
                  >
                    Templates
                  </Button>

                  <Button
                    fullWidth
                    onClick={() =>
                      navigate("/Generateprint")
                    }
                  >
                    Generate Barcode
                  </Button>

                  <Button
                    fullWidth
                    onClick={() =>
                      navigate("/ImportBarcode")
                    }
                  >
                    Import Barcode
                  </Button>

                  <Button
                    fullWidth
                    onClick={() =>
                      navigate("/Subscription")
                    }
                  >
                    Subscription
                  </Button>

                </InlineGrid>

              </BlockStack>

            </div>

          </Card>
        </Layout.Section>

        {/* Bottom Helpful Section */}

        <Layout.Section>

          <InlineGrid columns={2} gap="400">

            <Card>

              <div style={{ padding: 25 }}>

                <BlockStack gap="400">

                  <Text variant="headingLg">
                    🚀 Getting Started
                  </Text>

                  <Text>
                    1. Create your first barcode template.
                  </Text>

                  <Text>
                    2. Select products from Shopify.
                  </Text>

                  <Text>
                    3. Generate or print labels.
                  </Text>

                  <Text>
                    4. View your Generate History anytime.
                  </Text>

                  <Button
                    variant="primary"
                    onClick={() =>
                      navigate("/Templateslist")
                    }
                  >
                    Start Now
                  </Button>

                </BlockStack>

              </div>

            </Card>

            <Card>

              <div style={{ padding: 25 }}>

                <BlockStack gap="400">

                  <Text variant="headingLg">
                    💡 Tips & Tricks
                  </Text>

                  <Text>
                    • Use templates to save time.
                  </Text>

                  <Text>
                    • Preview labels before printing.
                  </Text>

                  <Text>
                    • Generate labels in bulk.
                  </Text>

                  <Text>
                    • Keep barcode history for future use.
                  </Text>

                  <Text>
                    • Export templates for backup.
                  </Text>

                </BlockStack>

              </div>

            </Card>

          </InlineGrid>

        </Layout.Section>

      </Layout>

    </Page>
  );
}
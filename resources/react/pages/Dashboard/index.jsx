import React, { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Grid,
  Text,
  Button,
  InlineGrid,
  Box,
  BlockStack,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    templates: 0,
    generated_barcodes: 0,
    printed_labels: 0,
    current_plan: "Free",
    free_labels: 200,
    used_labels: 0,
    bought_labels: 0,
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
            free_labels: 200,
            used_labels: 0,
            bought_labels: 0,
          }
        );
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <Page title="Dashboard" style={{paddingBottom: "20px"}}>

      <Layout>

        {/* Hero Banner */}

        <Layout.Section>
          <Card>
            <div
              style={{
                padding: "30px",
                borderRadius: "12px",
                background:
                  "linear-gradient(135deg,#1e1b4b,#5b21b6,#c026d3)",
                color: "#fff",
              }}
            >
              <BlockStack gap="300">

                <Text variant="headingLg" as="h2">
                  Struggling with creating templates?
                </Text>

                <Text as="p" variant="bodyMd">
                  Let us take care of the setup so you can focus on
                  growing your business. Create labels, generate
                  barcodes and print professionally.
                </Text>

                <div>
                  <Button variant="primary">
                    Book Free Setup
                  </Button>
                </div>

              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        

        {/* Quick Actions */}

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd">
                Quick Actions
              </Text>

              <div style={{ marginTop: "20px" }}>
                <InlineGrid columns={4} gap="400">

                  <Button
                    fullWidth
                    onClick={() => navigate("/Templateslist")}
                  >
                    Templates
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => navigate("/Generateprint")}
                  >
                    Generate Barcode
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => navigate("/ImportBarcode")}
                  >
                    Import Barcode
                  </Button>

                  <Button
                    fullWidth
                    onClick={() => navigate("/Subscription")}
                  >
                    Subscription
                  </Button>

                </InlineGrid>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Statistics */}

        <Layout.Section>
          <Card>
            <div style={{ padding: "10px" }}>
              <Text variant="headingMd">
                Dashboard Statistics
              </Text>

              <div style={{ marginTop: "20px" }}>
                <InlineGrid columns={4} gap="400">

                  <Box
                    padding="400"
                    borderWidth="025"
                    borderRadius="300"
                  >
                    <Text tone="subdued">
                      Total Templates
                    </Text>

                    <Text variant="headingLg">
                      {stats.templates}
                    </Text>
                  </Box>

                  <Box
                    padding="400"
                    borderWidth="025"
                    borderRadius="300"
                  >
                    <Text tone="subdued">
                      Generated Barcodes
                    </Text>

                    <Text variant="headingLg">
                      {stats.generated_barcodes}
                    </Text>
                  </Box>

                  <Box
                    padding="400"
                    borderWidth="025"
                    borderRadius="300"
                  >
                    <Text tone="subdued">
                      Printed Labels
                    </Text>

                    <Text variant="headingLg">
                      {stats.printed_labels}
                    </Text>
                  </Box>

                  <Box
                    padding="400"
                    borderWidth="025"
                    borderRadius="300"
                  >
                    <Text tone="subdued">
                      Current Plan
                    </Text>

                    <Text variant="headingLg">
                      {stats.current_plan}
                    </Text>
                  </Box>

                </InlineGrid>
              </div>
            </div>
          </Card>
        </Layout.Section>

        

      </Layout>

    </Page>
  );
}
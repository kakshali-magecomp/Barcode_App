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
} from "@shopify/polaris";

export default function Subscription() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      current: true,
      features: [
        "200 Labels / Month",
        "Basic Templates",
        "Generate Barcode",
        "Email Support",
      ],
    },
    {
      name: "Starter",
      price: "$9.99/month",
      popular: false,
      features: [
        "5,000 Labels / Month",
        "Unlimited Templates",
        "Bulk Barcode Generation",
        "Priority Support",
      ],
    },
    {
      name: "Pro",
      price: "$19.99/month",
      popular: true,
      features: [
        "20,000 Labels / Month",
        "Unlimited Templates",
        "Bulk Print Labels",
        "Advanced Barcode Settings",
        "Priority Support",
      ],
    },
    {
      name: "Enterprise",
      price: "$49.99/month",
      popular: false,
      features: [
        "Unlimited Labels",
        "Unlimited Templates",
        "Custom Barcode Rules",
        "Dedicated Support",
        "API Access",
      ],
    },
  ];

  return (
    <Page
      title="Subscription Plans"
      subtitle="Choose the plan that best fits your business."
    >
      <Layout>
        <Layout.Section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {plans.map((plan) => (
              <Card key={plan.name}>
                <BlockStack gap="400">

                  <InlineStack align="space-between">
                    <Text variant="headingLg" as="h2">
                      {plan.name}
                    </Text>

                    {plan.current && (
                      <Badge tone="success">
                        Current Plan
                      </Badge>
                    )}

                    {plan.popular && (
                      <Badge tone="attention">
                        Most Popular
                      </Badge>
                    )}
                  </InlineStack>

                  <Text variant="heading2xl" as="p">
                    {plan.price}
                  </Text>

                  <BlockStack gap="200">
                    {plan.features.map((feature, index) => (
                      <Text key={index} as="p">
                        ✓ {feature}
                      </Text>
                    ))}
                  </BlockStack>

                  <div style={{ marginTop: "15px" }}>
                    {plan.current ? (
                      <Button disabled fullWidth>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={() => {
                          console.log(
                            `Purchase ${plan.name} plan`
                          );
                        }}
                      >
                        Buy Plan
                      </Button>
                    )}
                  </div>

                </BlockStack>
              </Card>
            ))}
          </div>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd" as="h3">
                Why Upgrade?
              </Text>

              <Text as="p">
                Upgrade your plan to generate more barcodes,
                create unlimited templates, print labels in
                bulk, and unlock advanced barcode settings.
              </Text>

              <Text as="p">
                Higher plans also include priority support,
                automation tools, and future premium features.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
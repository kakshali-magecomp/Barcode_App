import React from "react";
import {
  Page,
  Card,
  List,
  Text,
  BlockStack,
  Badge,
} from "@shopify/polaris";

export default function UserPermission() {
  const permissions = [
    "Dashboard",
    "Products",
    "Templates",
    "Generate Barcode",
    "Generate SKU",
    "Print Labels",
    "Generate History",
    "Print History",
    "Barcode Settings",
    "SKU Settings",
    "Printing Settings",
    "Stocky Integration",
    "Translations",
    "User Permissions",
  ];

  return (
    <Page title="User Permissions">
      <Card>
        <div style={{ padding: "24px" }}>
          <BlockStack gap="500">
            <Text as="h2" variant="headingMd">
              Available Permissions
            </Text>

            <List type="bullet">
              {permissions.map((permission, index) => (
                <List.Item key={index}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text as="span">{permission}</Text>

                    <Badge tone="success">
                      Allowed
                    </Badge>
                  </div>
                </List.Item>
              ))}
            </List>
          </BlockStack>
        </div>
      </Card>
    </Page>
  );
}
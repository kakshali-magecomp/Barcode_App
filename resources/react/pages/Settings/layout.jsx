import React, { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  BlockStack,
} from "@shopify/polaris";

import Barcode from "./barcode";
import SKU from "./sku";
import Printing from "./printing";
import Stocky from "./stocky";
import Translation from "./translation";
import ApiAccess from "./apiAccess";

export default function SettingsLayout() {
  const [activeTab, setActiveTab] = useState("barcode");

  const menuItems = [
    {
      key: "barcode",
      label: "Barcode",
    },
    {
      key: "sku",
      label: "SKU",
    },
    {
      key: "printing",
      label: "Printing",
    },
    {
      key: "stocky",
      label: "Stocky",
    },
    {
      key: "translation",
      label: "Translation",
    },
    {
      key: "api",
      label: "API Access",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "barcode":
        return <Barcode />;

      case "sku":
        return <SKU />;

      case "printing":
        return <Printing />;

      case "stocky":
        return <Stocky />;

      case "translation":
        return <Translation />;

      case "api":
        return <ApiAccess />;

      default:
        return <Barcode />;
    }
  };

  return (
    <Page title="Settings">
      <Layout>

        {/* Sidebar */}

        <Layout.Section variant="oneThird">
          <Card>
            <div style={{ padding: "12px" }}>
              <BlockStack gap="200">

                {menuItems.map((item) => (
                  <Button
                    key={item.key}
                    fullWidth
                    pressed={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}

              </BlockStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Content */}

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              {renderContent()}
            </div>
          </Card>
        </Layout.Section>

      </Layout>
    </Page>
  );
}
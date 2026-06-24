import React, { useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  Button,
  BlockStack,
  Banner,
  Spinner,
} from "@shopify/polaris";
import { useNavigate } from "react-router-dom";

export default function StockPO() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetchStockySettings();
  }, []);

  const fetchStockySettings = async () => {
    try {
      const response = await fetch("/api/stocky-settings");

      const result = await response.json();

      if (result.success) {
        setApiKey(result.api_key || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Page title="Stocky Purchase Orders">
        <div style={{ padding: "40px", textAlign: "center" }}>
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Stocky Purchase Orders">
      {!apiKey ? (
        <Card>
          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">
                Stocky API Key Required
              </Text>

              <Banner tone="warning">
                Please setup your Stocky API Key first to access
                Stocky Purchase Orders.
              </Banner>

              <Text as="p" tone="subdued">
                Stocky integration requires a valid API Key to
                sync purchase orders and inventory data.
              </Text>

              <Button
                variant="primary"
                onClick={() => navigate("/layout/stocky")}
              >
                Setup API Key
              </Button>
            </BlockStack>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ padding: "20px" }}>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">
                Stocky Purchase Orders
              </Text>

              <Text as="p">
                Your Stocky API Key is connected successfully.
              </Text>

              <Text as="p">
                Here you can display:
              </Text>

              <ul>
                <li>Purchase Orders</li>
                <li>Suppliers</li>
                <li>Inventory Levels</li>
                <li>Incoming Stock</li>
              </ul>
            </BlockStack>
          </div>
        </Card>
      )}
    </Page>
  );
}
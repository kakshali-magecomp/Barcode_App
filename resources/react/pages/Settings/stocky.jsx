import React, { useState } from "react";
import {
  Card,
  Text,
  TextField,
  Button,
  BlockStack,
  Banner,
} from "@shopify/polaris";

export default function Stocky() {
  const [apiKey, setApiKey] = useState("");

  const handleSave = () => {
    console.log({
      api_key: apiKey,
    });

    // API call here
    // fetch('/api/stocky/settings', {...})
  };

  return (
    <BlockStack gap="500">
      <Text variant="headingLg" as="h2">
        Stocky Settings
      </Text>

      <Banner tone="info">
        Connect your Stocky account by providing your API key.
      </Banner>

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              API Key
            </Text>

            <Text tone="subdued">
              You can find your Stocky API Key here.
            </Text>

            <TextField
              label="Stocky API Key"
              value={apiKey}
              onChange={setApiKey}
              autoComplete="off"
              placeholder="Enter your Stocky API Key"
            />

          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        onClick={handleSave}
      >
        Save Settings
      </Button>
    </BlockStack>
  );
}
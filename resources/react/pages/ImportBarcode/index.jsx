import React, { useState } from "react";
import {
  Page,
  Card,
  Text,
  RadioButton,
  TextField,
  Button,
  DropZone,
  BlockStack,
  InlineStack,
  Divider,
  Banner,
} from "@shopify/polaris";

export default function ImportBarcode() {
  const [importType, setImportType] = useState("handle");
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const handleDrop = (_dropFiles, acceptedFiles) => {
    setFile(acceptedFiles[0]);
  };

  const handleImport = () => {
    console.log({
      importType,
      file,
      email,
      note,
    });
  };

  return (
    <Page
      title="Import Barcode & SKU"
      subtitle="Import existing barcode data into your Shopify products"
    >
      <Card>
        <div style={{ padding: "24px" }}>
          <BlockStack gap="500">

            <Banner tone="info">
              If you already have the barcodes for products in another
              system and want to use them for your Shopify products,
              import them here.
            </Banner>

            <Text variant="headingMd" as="h2">
              Import Method
            </Text>

            <RadioButton
              label="Import barcode with product handle"
              checked={importType === "handle"}
              id="handle"
              name="importMethod"
              onChange={() => setImportType("handle")}
            />

            <RadioButton
              label="Import barcode with product id & variant id"
              checked={importType === "variant"}
              id="variant"
              name="importMethod"
              onChange={() => setImportType("variant")}
            />

            <Divider />

            <InlineStack align="space-between">
              <Text variant="headingMd">
                Sample CSV Files
              </Text>

              <InlineStack gap="200">
                <Button size="slim">
                  Product Handle Sample
                </Button>

                <Button size="slim">
                  Variant ID Sample
                </Button>
              </InlineStack>
            </InlineStack>

            <Divider />

            <Text variant="headingMd">
              Upload CSV File
            </Text>

            <DropZone
              allowMultiple={false}
              accept=".csv"
              onDrop={handleDrop}
            >
              <DropZone.FileUpload />
            </DropZone>

            {file && (
              <Banner tone="success">
                Selected File: <strong>{file.name}</strong>
              </Banner>
            )}

            <TextField
              label="Email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={setEmail}
              helpText="Import report will be sent to this email."
            />

            <TextField
              label="Note"
              value={note}
              multiline={4}
              autoComplete="off"
              onChange={setNote}
            />

            <Banner tone="warning">
              Important Note: You can only import barcodes for
              products that already exist in your Shopify store.
            </Banner>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "10px",
              }}
            >
              <Button
                variant="primary"
                size="large"
                onClick={handleImport}
              >
                Import
              </Button>
            </div>

          </BlockStack>
        </div>
      </Card>
    </Page>
  );
}
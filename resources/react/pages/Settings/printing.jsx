import React, { useState } from "react";
import {
  Card,
  Text,
  Select,
  Checkbox,
  Button,
  BlockStack,
  Banner,
  TextField,
} from "@shopify/polaris";

export default function Printing() {
  const [paperSize, setPaperSize] = useState("a4");
  const [printerType, setPrinterType] = useState("thermal");
  const [printQuantity, setPrintQuantity] = useState("1");

  const [showBarcode, setShowBarcode] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  const handleSave = () => {
    console.log({
      paperSize,
      printerType,
      printQuantity,
      showBarcode,
      showSku,
      showProductName,
      showPrice,
      autoPrint,
    });

    // API Call
    // fetch('/api/settings/printing', {...})
  };

  return (
    <BlockStack gap="500">

      <Text variant="headingLg" as="h2">
        Printing Settings
      </Text>

      <Banner tone="info">
        Configure how barcode labels are printed and displayed.
      </Banner>

      {/* Printer Settings */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              Printer Configuration
            </Text>

            <Select
              label="Printer Type"
              options={[
                { label: "Thermal Printer", value: "thermal" },
                { label: "Laser Printer", value: "laser" },
                { label: "Inkjet Printer", value: "inkjet" },
              ]}
              value={printerType}
              onChange={setPrinterType}
            />

            <Select
              label="Paper Size"
              options={[
                { label: "A4", value: "a4" },
                { label: "Letter", value: "letter" },
                { label: "4 x 6 Label", value: "4x6" },
                { label: "2 x 1 Label", value: "2x1" },
              ]}
              value={paperSize}
              onChange={setPaperSize}
            />

            <TextField
              label="Default Print Quantity"
              value={printQuantity}
              onChange={setPrintQuantity}
              autoComplete="off"
            />

          </BlockStack>
        </div>
      </Card>

      {/* Label Content */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              Label Content
            </Text>

            <Checkbox
              label="Show Barcode"
              checked={showBarcode}
              onChange={setShowBarcode}
            />

            <Checkbox
              label="Show SKU"
              checked={showSku}
              onChange={setShowSku}
            />

            <Checkbox
              label="Show Product Name"
              checked={showProductName}
              onChange={setShowProductName}
            />

            <Checkbox
              label="Show Product Price"
              checked={showPrice}
              onChange={setShowPrice}
            />

          </BlockStack>
        </div>
      </Card>

      {/* Automation */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="400">

            <Text variant="headingMd">
              Automation
            </Text>

            <Checkbox
              label="Automatically Print Labels After Barcode Generation"
              checked={autoPrint}
              onChange={setAutoPrint}
            />

          </BlockStack>
        </div>
      </Card>

      {/* Information */}

      <Card>
        <div style={{ padding: "20px" }}>
          <BlockStack gap="300">

            <Text variant="headingMd">
              Information
            </Text>

            <Text tone="subdued">
              These settings control the default printing behavior
              used when generating barcode labels.
            </Text>

            <Text tone="subdued">
              You can override these options during individual print jobs.
            </Text>

          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        onClick={handleSave}
      >
        Save Printing Settings
      </Button>

    </BlockStack>
  );
}
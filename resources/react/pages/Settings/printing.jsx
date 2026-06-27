import React, { useEffect, useState } from "react";
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
import { useAppBridge } from "@shopify/app-bridge-react";

export default function Printing() {
  const shopify = useAppBridge();

  const [loading, setLoading] = useState(false);

  const [paperSize, setPaperSize] = useState("a4");
  const [printerType, setPrinterType] = useState("thermal");
  const [printQuantity, setPrintQuantity] = useState("1");

  const [showBarcode, setShowBarcode] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showPrice, setShowPrice] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const result = await response.json();

      if (!result.success) return;

      const s = result.data;

      setPrinterType(s.printer_type || "thermal");
      setPaperSize(s.paper_size || "a4");
      setPrintQuantity(
        String(s.default_print_quantity || 1)
      );

      setShowBarcode(Boolean(s.show_barcode));
      setShowSku(Boolean(s.show_sku));
      setShowProductName(Boolean(s.show_product_name));
      setShowPrice(Boolean(s.show_price));
      setAutoPrint(Boolean(s.auto_print));
    } catch (error) {
      console.error(error);

      shopify.toast.show("Failed to load settings", {
        isError: true,
      });
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          printer_type: printerType,
          paper_size: paperSize,
          default_print_quantity: printQuantity,

          show_barcode: showBarcode,
          show_sku: showSku,
          show_product_name: showProductName,
          show_price: showPrice,

          auto_print: autoPrint,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      shopify.toast.show(
        "Printing settings saved successfully"
      );
    } catch (error) {
      console.error(error);

      shopify.toast.show(
        error.message || "Unable to save settings",
        {
          isError: true,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BlockStack gap="500">
      <Text variant="headingLg" as="h2">
        Printing Settings
      </Text>

      <Banner tone="info">
        Configure how barcode labels are printed and displayed.
      </Banner>

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <Text variant="headingMd">
              Printer Configuration
            </Text>

            <Select
              label="Printer Type"
              value={printerType}
              onChange={setPrinterType}
              options={[
                {
                  label: "Thermal Printer",
                  value: "thermal",
                },
                {
                  label: "Laser Printer",
                  value: "laser",
                },
                {
                  label: "Inkjet Printer",
                  value: "inkjet",
                },
              ]}
            />

            <Select
              label="Paper Size"
              value={paperSize}
              onChange={setPaperSize}
              options={[
                {
                  label: "A4",
                  value: "a4",
                },
                {
                  label: "Letter",
                  value: "letter",
                },
                {
                  label: "4 × 6 Label",
                  value: "4x6",
                },
                {
                  label: "2 × 1 Label",
                  value: "2x1",
                },
              ]}
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

      <Card>
        <div style={{ padding: 20 }}>
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

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="400">
            <Text variant="headingMd">
              Automation
            </Text>

            <Checkbox
              label="Automatically print after barcode generation"
              checked={autoPrint}
              onChange={setAutoPrint}
            />
          </BlockStack>
        </div>
      </Card>

      <Card>
        <div style={{ padding: 20 }}>
          <BlockStack gap="300">
            <Text variant="headingMd">
              Information
            </Text>

            <Text tone="subdued">
              These settings become the default for every print
              operation in the app.
            </Text>

            <Text tone="subdued">
              Users can still override them while printing labels.
            </Text>
          </BlockStack>
        </div>
      </Card>

      <Button
        variant="primary"
        loading={loading}
        onClick={handleSave}
      >
        Save Printing Settings
      </Button>
    </BlockStack>
  );
}
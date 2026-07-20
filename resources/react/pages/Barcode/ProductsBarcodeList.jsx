import React, { useState } from "react";
import {
    Page,
    Card,
    RadioButton,
    Button,
    Text,
    BlockStack,
    Banner,
    Divider,
    InlineStack,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import ProductPickerModal from "../../components/ProductPickerModal";

export default function GenerateBarcode()  {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;
    const [method, setMethod] = useState("missing");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [generatedProducts, setGeneratedProducts] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateBarcode = async () => {
    // Validation
    if (method !== "missing" && selectedProducts.length === 0) {
        appBridge.toast.show(
            "Please select at least one product."
        );
        return;
    }

    try {
        setLoading(true);
        setError("");

        const requestData = {
            method,
            variants:
                method === "missing"
                    ? []
                    : selectedProducts.map((item) => ({
                          product_id: item.product_id,
                          variant_id: item.variant_id,
                          inventory_item_id: item.inventory_item_id,
                          product_title: item.product_title,
                          variant_title: item.variant_title,
                          vendor: item.vendor,
                          product_type: item.product_type,
                          current_sku: item.current_sku,
                          barcode: item.barcode,
                          option_1: item.option_1,
                          option_2: item.option_2,
                          option_3: item.option_3,
                          metafields: item.metafields,
                      })),
        };

        console.log("Generate Barcode Payload", requestData);

        const response = await fetch(
            "/api/products/generate-barcode",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(requestData),
            }
        );

        const json = await response.json();

        console.log("Generate Barcode Response", json);

        if (!response.ok) {
            throw new Error(
                json.error ||
                    json.message ||
                    "Unable to generate barcode."
            );
        }

        if (json.status !== 1) {
            throw new Error(
                json.error ||
                    json.message ||
                    "Barcode generation failed."
            );
        }

        appBridge.toast.show(
            json.message || "Barcode generated successfully."
        );

        setGeneratedProducts(
            json.updated_products || []
        );

        // Close picker only
        setPickerOpen(false);

        // Optional:
        // Uncomment if you want to clear selected products after success.
        // setSelectedProducts([]);

    } catch (err) {
        console.error("Generate Barcode Error:", err);

        setError(
            err.message ||
                "Something went wrong while generating barcode."
        );

        appBridge.toast.show(
            err.message || "Server Error"
        );

    } finally {
        setLoading(false);
    }
};

    return (
        <Page title="Generate Barcode">
            {error && (
                <Banner tone="critical" onDismiss={() => setError("")}>
                    {error}
                </Banner>
            )}

            <Card>
                <BlockStack gap="500">
                    <Text variant="headingMd" as="h2">
                        SKU Generation Method
                    </Text>

                    <RadioButton
                        label="Only generate barcode for selected products or variants that don't have barcode value yet"
                        checked={method === "missing"}
                        id="missing"
                        name="method"
                        onChange={() => setMethod("missing")}
                    />

                    <RadioButton
                        label="Generate barcode for all selected products or variants. If products or variants don't have barcode value, generate new barcode data. 
                        If products or variants already have barcode value, replace the old value with new one"
                        checked={method === "replace"}
                        id="replace"
                        name="method"
                        onChange={() => setMethod("replace")}
                    />
                    {method === "replace" && (
                        <Banner tone="warning">
                            <strong>Warning</strong>
                            <br/>
                            Be careful with this option, your old barcode will be replaced, old printed labels will not be scanned. This option should be selected only when you want to change the barcode on your system                        </Banner>
                    )}

                    <RadioButton
                        label="Generate barcode from SKU"
                        checked={method === "sku"}
                        id="SKU"
                        name="method"
                        onChange={() => setMethod("sku")}
                    />

                    <Divider />
                    <InlineStack
                        align="space-between"
                        blockAlign="center"
                        gap="400"
                    >
                        <Text variant="headingMd" as="h2">
                            Selected Products
                        </Text>

                        {method === "missing" ? (
                            <Text as="p" tone="subdued">
                                All products without Barcode will be processed automatically.
                            </Text>
                        ) : (
                            <Text as="p" tone="subdued">
                                {selectedProducts.length} product
                                {selectedProducts.length !== 1 ? "s" : ""} selected
                            </Text>
                        )}

                        {method !== "missing" && (
                            <Button onClick={() => setPickerOpen(true)}>
                                Choose Products
                            </Button>
                        )}

                        <Button
                            variant="primary"
                            loading={loading}
                            onClick={generateBarcode}
                        >
                            Generate Barcode
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Card>
            {generatedProducts.length > 0 && (
                <Card>
                    <BlockStack gap="400">

                        <Text variant="headingMd" as="h2">
                            Generated Barcode Summary
                        </Text>

                        {generatedProducts.map((item, index) => (

                            <Card key={index} roundedAbove="sm">

                                <BlockStack gap="200">

                                    <Text fontWeight="bold">
                                        {item.product_title}
                                    </Text>

                                    {item.variant_title !== "Default Title" && (
                                        <Text tone="subdued">
                                            {item.variant_title}
                                        </Text>
                                    )}

                                    <Text>
                                        Old Barcode :
                                        <strong> {item.old_barcode || "-"}</strong>
                                    </Text>

                                    <Text tone="success">
                                        New Barcode :
                                        <strong> {item.new_barcode}</strong>
                                    </Text>

                                </BlockStack>

                            </Card>

                        ))}

                    </BlockStack>
                </Card>
            )}

            <ProductPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(products) => {
                    setSelectedProducts(products);
                    setPickerOpen(false);
                }}
            />
        </Page>
    );
} 
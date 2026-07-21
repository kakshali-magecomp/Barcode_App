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
import ProductPickerModal from "../components/ProductPickerModal";

export default function GenerateSku() {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;
    const [updatedProducts, setUpdatedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [method, setMethod] = useState("missing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const generateSku = async () => {
        if (
            method !== "missing" &&
            selectedProducts.length === 0
        ) {
            appBridge.toast.show("Please select at least one product.");
            return;
        }
        try {
            setLoading(true);
            setError("");
            const payload = {
                method,
                variants:
                    method === "missing"
                        ? []
                        : selectedProducts.map(item => ({
                            product_id: item.product_id,
                            variant_id: item.variant_id,
                            inventory_item_id: item.inventory_item_id,
                            product_title: item.product_title,
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
            console.log(payload);
            const response = await fetch("/api/products/generate-sku", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                throw new Error("Server Error");
            }
            const json = await response.json();
            if (json.status === 1) {
                appBridge.toast.show(json.message || "SKU generated successfully.");
                setUpdatedProducts(json.updated_products || []);
                setSelectedProducts([]);
                setPickerOpen(false);
            } else {
                setError(json.error || "Something went wrong.");
            }
        } catch (err) {
            console.error(err);
            setError(err.message || "Server Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page title="Generate SKU" subtitle="Manage and edit your customized SKU">
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
                        label="Only generate SKU for selected products or variants that don't have SKU"
                        checked={method === "missing"}
                        id="missing"
                        name="method"
                        onChange={() => setMethod("missing")}
                    />
                    <RadioButton
                        label="Generate SKU for all selected products or variants. Replace existing SKU if already available."
                        checked={method === "replace"}
                        id="replace"
                        name="method"
                        onChange={() => setMethod("replace")}
                    />
                    <RadioButton
                        label="Generate SKU from barcode number"
                        checked={method === "barcode"}
                        id="barcode"
                        name="method"
                        onChange={() => setMethod("barcode")}
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
                                All products without SKU will be processed automatically.
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
                            onClick={generateSku}
                        >
                            Generate SKU
                        </Button>
                    </InlineStack>
                </BlockStack>
            </Card>
            {updatedProducts.length > 0 && (
                <Card>
                    <BlockStack gap="400">
                        <Text variant="headingMd" as="h2">
                            Generated SKU Summary
                        </Text>
                        {updatedProducts.map((item, index) => (
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
                                        Old SKU :
                                        <strong> {item.old_sku || "-"}</strong>
                                    </Text>
                                    <Text tone="success">
                                        New SKU :
                                        <strong> {item.new_sku}</strong>
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
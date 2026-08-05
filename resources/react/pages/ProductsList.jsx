import React, { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import ProductPickerModal from "../components/ProductPickerModal";

export default function GenerateSku() {
    const shopify = useAppBridge();
    const [updatedProducts, setUpdatedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [method, setMethod] = useState("missing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateSku = async () => {
        if (!method) {
            setError("Please choose an SKU generation method.");
            return;
        }
        if (method !== "missing" && selectedProducts.length === 0) {
            shopify.toast.show("Please select at least one product.");
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
                            price: item.price,
                            option_1: item.option_1,
                            option_2: item.option_2,
                            option_3: item.option_3,
                            metafields: item.metafields,
                        })),
            };

            const response = await fetch("/api/products/generate-sku", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            });
            const json = await response.json();

            if (!response.ok) {

                if (response.status === 422) {
                    const fieldErrors = json.errors
                        ? Object.values(json.errors).flat().join(' ')
                        : '';
                    throw new Error(json.message || fieldErrors || "Validation failed.");
                }
                throw new Error(json.message || `Server Error (${response.status})`);
            }
            if (json.status === 1) {
                if (json.generated_count === 0) {
                    shopify.toast.show("All products already have SKU.");
                } else {
                    shopify.toast.show(
                        json.message || "SKU generated successfully."
                    );
                }
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
        <s-page heading="Generate SKU" subheading="Manage and edit your customized SKU">
            {error && (
                <s-section>
                    <s-banner tone="critical" onDismiss={() => setError("")}>
                        {error}
                    </s-banner>
                </s-section>
            )}

            <s-section>
                <s-stack direction="block" gap="base">
                    <s-heading>SKU Generation Method</s-heading>
                    <s-choice-list
                        name="method"
                        label="SKU generation method"
                        labelAccessibilityVisibility="exclusive"
                        onChange={(event) => {
                            const selected = event.currentTarget.values?.[0];
                            if (selected) setMethod(selected);
                        }}
                    >
                        <s-choice value="missing" selected={method === "missing"}>
                            Only generate SKU for selected products or variants that don't have SKU
                        </s-choice>
                        <s-choice value="replace" selected={method === "replace"}>
                            Generate SKU for all selected products or variants. Replace existing SKU if already available.
                        </s-choice>
                        <s-choice value="barcode" selected={method === "barcode"}>
                            Generate SKU from barcode number
                        </s-choice>
                    </s-choice-list>

                    <s-divider />

                    <s-stack direction="inline" gap="base" alignItems="center" justifyContent="space-between">
                        <s-heading>Selected Products</s-heading>

                        {method === "missing" ? (
                            <s-text tone="subdued">
                                All products without SKU will be processed automatically.
                            </s-text>
                        ) : (
                            <s-text tone="subdued">
                                {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} selected
                            </s-text>
                        )}

                        {method !== "missing" && (
                            <s-button onClick={() => setPickerOpen(true)}>
                                Choose Products
                            </s-button>
                        )}

                        <s-button variant="primary" loading={loading || undefined} onClick={generateSku}>
                            Generate SKU
                        </s-button>
                    </s-stack>
                </s-stack>
            </s-section>

            {updatedProducts.length > 0 && (
                <s-section>
                    <s-stack direction="block" gap="base">
                        <s-heading>Generated SKU Summary</s-heading>
                        {updatedProducts.map((item, index) => (
                            <s-box key={index} padding="base" borderWidth="base" borderRadius="base">
                                <s-stack direction="block" gap="tight">
                                    <s-text fontWeight="bold">{item.product_title}</s-text>
                                    {item.variant_title !== "Default Title" && (
                                        <s-text tone="subdued">{item.variant_title}</s-text>
                                    )}
                                    <s-text>
                                        Old SKU: <s-text fontWeight="bold">{item.old_sku || "-"}</s-text>
                                    </s-text>
                                    <s-text tone="success">
                                        New SKU: <s-text fontWeight="bold">{item.new_sku}</s-text>
                                    </s-text>
                                </s-stack>
                            </s-box>
                        ))}
                    </s-stack>
                </s-section>
            )}

            <ProductPickerModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={(products) => {
                    setSelectedProducts(products);
                    setPickerOpen(false);
                }}
            />
        </s-page>
    );
}
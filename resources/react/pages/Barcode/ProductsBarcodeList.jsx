import React, { useState, useEffect, useRef } from "react";
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
    Select,
    Box,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import ProductPickerModal from "../../components/ProductPickerModal";
import BarcodeRenderer from "../../components/BarcodeRenderer";
import QrCodeRenderer from "../../components/QrCodeRenderer";

export default function GenerateBarcode() {
    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;
    const [method, setMethod] = useState("missing");
    const [previewItem, setPreviewItem] = useState(null);
    const updateProductQuantity = (variantId, qty) => {
        setSelectedProducts((prev) =>
            prev.map((item) =>
                item.variant_id === variantId
                    ? {
                        ...item,
                        quantity: Math.max(1, Number(qty)),
                    }
                    : item
            )
        );
    };
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [generatedProducts, setGeneratedProducts] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const printRef = useRef();
    const [templates, setTemplates] = useState([]);
    const [templateDesign, setTemplateDesign] = useState(null);
    useEffect(() => {
        console.log("Template Design");
        console.log(templateDesign);
    }, [templateDesign]);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTemplates() {
            try {
                const res = await fetch("/api/templates");
                const json = await res.json();
                console.log(json);
                if (json.success) {
                    setTemplates(json.data || []);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadTemplates();
    }, []);

    const handleTemplateChange = async (templateId) => {
        setSelectedTemplate(templateId);
        if (!templateId) {
            setTemplateDesign(null);
            return;
        }
        try {
            setLoadingTemplate(true);
            const response = await fetch(
                `/api/templates/design/${templateId}`
            );
            const json = await response.json();
            console.log("Template Design Response:", json);
            if (json.success) {
                setTemplateDesign(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTemplate(false);
        }
    };

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
    const handlePrint = () => {
        let labels = "";
        selectedProducts.forEach((product) => {
            const label = document
                .getElementById(`label-${product.variant_id}`)
                .querySelector(".print-label");
            if (!label) return;
            for (let i = 0; i < product.quantity; i++) {
                labels += `
                <div class="label">
                    ${label.innerHTML}
                </div>
            `;
            }
        });
        const printWindow = window.open("", "", "width=900,height=700");
        printWindow.document.write(`
<html>
<head>
<style>
body{
display:flex;
flex-wrap:wrap;
gap:15px;
padding:20px;
font-family:Arial;
}
.label{
padding:15px;
page-break-inside:avoid;
}
svg,img{
max-width:100%;
}
</style>
</head>
<body>
${labels}
</body>
</html>
`);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <Page title="Generate Barcode"
            subtitle="Manage and edit your customized Barcode"
            primaryAction={{
                content: 'Print History',
                url: '#',
            }}
        >
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
                            <br />
                            Be careful with this option, your old barcode will be replaced, old printed labels will not be scanned. This option should be selected only when you want to change the barcode on your system                        </Banner>
                    )}
                    <RadioButton
                        label="Generate barcode from SKU"
                        checked={method === "sku"}
                        id="SKU"
                        name="method"
                        onChange={() => setMethod("sku")}
                    />
                    <RadioButton
                        label="Only Print Labels for selected products or variants already have barcode"
                        checked={method === "print"}
                        id="print"
                        name="method"
                        onChange={() => setMethod("print")}
                    />
                    {method === "print" && (
                        <Box maxWidth="350px">
                            <Select
                                label="Choose a template to print"
                                options={[
                                    { label: "Select Template", value: "" },
                                    ...templates.map((t) => ({
                                        label: t.template_name,
                                        value: String(t.id),
                                    })),
                                ]}
                                value={selectedTemplate}
                                onChange={handleTemplateChange}
                            />
                        </Box>
                    )}
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
                    console.log("Selected Products:", products);
                    const productsWithQty = products.map(product => ({  // Add default quantity to every selected product
                        ...product,
                        quantity: 1,
                    }));
                    setSelectedProducts(productsWithQty);// Save products with quantity
                    if (productsWithQty.length > 0) {// Show first product in preview
                        const first = productsWithQty[0];
                        setPreviewItem({
                            title: first.product_title,
                            sku: first.current_sku,
                            barcode: first.barcode || first.current_barcode,
                            price: first.price,
                            vendor: first.vendor,
                            option_1: first.option_1,
                            online_url: first.online_url,
                        });
                    }
                    setPickerOpen(false);
                }}
            />
            {method === "print" && templateDesign && previewItem && (
                <Card padding="400">
                    <Text variant="headingMd" as="h2">
                        Preview
                    </Text>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "20px",
                            marginTop: "20px",
                        }}
                        ref={printRef}
                        className="label"
                    >
                        {selectedProducts.map((product) => (
                            <div
                                id={`label-${product.variant_id}`}
                                key={product.variant_id}
                                style={{
                                    width: "230px",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    padding: "15px",
                                    background: "#fff",
                                }}
                            >
                                {/* THIS IS ONLY FOR UI - NOT PRINT */}
                                <div
                                    className="no-print"
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "12px",
                                    }}
                                >
                                    <strong>{product.product_title}</strong>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <Button
                                            size="slim"
                                            onClick={() =>
                                                updateProductQuantity(
                                                    product.variant_id,
                                                    product.quantity - 1
                                                )
                                            }
                                        >
                                            -
                                        </Button>
                                        <Text>{product.quantity}</Text>
                                        <Button
                                            size="slim"
                                            onClick={() =>
                                                updateProductQuantity(
                                                    product.variant_id,
                                                    product.quantity + 1
                                                )
                                            }
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                {/* THIS IS THE PRINTABLE LABEL */}
                                <div className="print-label">

                                    {templateDesign?.line1_sku && (
                                        <div>{product.current_sku}</div>
                                    )}

                                    {templateDesign?.line2_name && (
                                        <div>{product.product_title}</div>
                                    )}

                                    {templateDesign?.line2_price && (
                                        <div>${product.price}</div>
                                    )}

                                    {templateDesign.symbol_type === "BARCODE" ? (
                                        <BarcodeRenderer
                                            value={
                                                templateDesign.symbol_field_source === "barcode_value"
                                                    ? product.barcode
                                                    : product.current_sku
                                            }
                                            settings={templateDesign}
                                        />
                                    ) : (
                                        <QrCodeRenderer
                                            value={
                                                templateDesign.symbol_field_source === "product_online_url"
                                                    ? product.online_url
                                                    : product.barcode
                                            }
                                            settings={templateDesign}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Box paddingBlockStart="400">
                        <InlineStack align="end">
                            <Button
                                variant="primary"
                                size="medium"
                                onClick={handlePrint}
                            >
                                Print Label
                            </Button>
                        </InlineStack>
                    </Box>
                </Card>
            )}
        </Page>
    );
} 
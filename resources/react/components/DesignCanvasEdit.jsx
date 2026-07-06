import React, { useEffect, useState } from "react";
import {
    Card,
    BlockStack,
    Banner,
    Spinner,
    Box,
} from "@shopify/polaris";

import LineControls from "../components/LineControls";
import SymbolControls from "../components/SymbolControls";
import QrCodeRenderer from "../components/QrCodeRenderer";
import BarcodeRenderer from "../components/BarcodeRenderer";

export default function DesignCanvasEdit({
    templateId,
    onChange,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [design, setDesign] = useState({
        line1_sku: true,
        line2_name: true,
        line2_price: false,
        line2_variant_option1: false,
        line3_vendor: false,

        symbol_enabled: true,
        symbol_type: "BARCODE",
        symbol_color: "#000000",
        symbol_field_source: "barcode_value",

        print_qty: 1,
    });
    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState("");

    const [previewItem, setPreviewItem] = useState({
        title: "Sample Item",
        sku: "SKU-1001",
        price: "10.00",
        vendor: "Vendor",
        option_1: "",
        online_url: "",
    });

    useEffect(() => {
        loadDesign();
    }, [templateId]);

    async function loadDesign() {
        try {
            setLoading(true);

            const [templateRes, productRes] = await Promise.all([
                fetch(`/api/templates/design/${templateId}`),
                fetch(`/api/products`)
            ]);

            console.log("Template Status:", templateRes.status);
            console.log("Product Status:", productRes.status);
            console.log("Variants:", productRes.variants);

            const template = await templateRes.json();
            const products = await productRes.json();

            console.log("Template:", template);
            console.log("Products:", products);

            if (template.success) {
                setDesign(template.data);
                onChange?.(template.data);
            }

            if (products.status === 1 && products.variants?.length) {
                setStoreVariants(products.variants);

                const first = products.variants[0];

                setSelectedVariantId(first.variant_id);

                setPreviewItem({
                    title: first.product_title,
                    sku: first.current_sku || "NO SKU",
                    price: first.price,
                    vendor: first.vendor,
                    option_1:
                        first.variant_title !== "Default Title"
                            ? first.variant_title
                            : "",
                    online_url: first.online_url,
                });
            }

        } catch (error) {
            console.error(error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function updateField(key, value) {
        const updated = {
            ...design,
            [key]: value,
        };

        setDesign(updated);

        if (onChange) {
            onChange(updated);
        }
    }

    if (loading) {
        return (
            <Box padding="400">
                <Spinner />
            </Box>
        );
    }

    return (
        <Card padding="500">
            <BlockStack gap="500">

                {error && (
                    <Banner tone="critical">
                        {error}
                    </Banner>
                )}

                <LineControls
                    design={design}
                    handleUpdate={updateField}
                />

                <SymbolControls
                    design={design}
                    handleUpdate={updateField}
                />
                <Card padding="400">

                    <div
                        style={{
                            background: "#fff",
                            border: "1px solid #d9d9d9",
                            padding: "20px",
                            textAlign: "center",
                            borderRadius: "6px"
                        }}
                    >

                        {design.line1_sku && (

                            <div
                                style={{
                                    fontSize: 14,
                                    fontFamily: "monospace",
                                    marginBottom: 5
                                }}
                            >
                                {previewItem.sku}
                            </div>
                        )}
                        <div>
                            {design.line2_name && (
                                <span
                                    style={{
                                        fontWeight: "bold",
                                        fontSize: 16
                                    }}
                                >
                                    {previewItem.title}
                                </span>
                            )}
                            {design.line2_variant_option1 &&
                                previewItem.option_1 && (
                                    <span
                                        style={{
                                            marginLeft: 5,
                                            color: "#666"
                                        }}
                                    >
                                        {previewItem.option_1}
                                    </span>
                                )}
                            {design.line2_price && (
                                <span
                                    style={{
                                        marginLeft: 10,
                                        color: "green",
                                        fontWeight: "bold"
                                    }}
                                >
                                    ${previewItem.price}
                                </span>
                            )}
                        </div>
                        {design.line3_vendor && (
                            <div
                                style={{
                                    marginTop: 5,
                                    fontSize: 13
                                }}
                            >
                                {previewItem.vendor}
                            </div>
                        )}
                        {design.symbol_enabled && (
                            <Box
                                paddingBlockStart="400"
                            >
                                {design.symbol_type === "BARCODE"
                                    ?
                                    <BarcodeRenderer
                                        value={previewItem.sku}
                                        settings={design}
                                    />
                                    :
                                    <QrCodeRenderer
                                        value={previewItem.sku}
                                        settings={design}

                                    />
                                }
                            </Box>
                        )}
                    </div>
                </Card>
            </BlockStack>
        </Card>
    );
}
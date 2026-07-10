import React, { useEffect, useState, useRef } from "react";
import {
    Card,
    BlockStack,
    Banner,
    Spinner,
    Box,
} from "@shopify/polaris";

import LineControls from "../components/LineControls";
import SymbolControls from "../components/SymbolControls";
import BarcodeRenderer from "../components/BarcodeRenderer";
import QrCodeRenderer from "../components/QrCodeRenderer";

const defaultDesign = {
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
};

export default function DesignCanvasEdit({
    templateId,
    onChange,
    onDirty,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [design, setDesign] = useState(defaultDesign);

    const [previewItem, setPreviewItem] = useState({
        title: "Sample Item",
        sku: "SKU-1001",
        price: "10.00",
        vendor: "Vendor",
        option_1: "",
        online_url: "",
    });
    const printRef = useRef(null);

    useEffect(() => {
        loadDesign();
    }, [templateId]);

    async function loadDesign() {
        try {
            setLoading(true);

            const [templateRes, productRes] = await Promise.all([
                fetch(`/api/templates/design/${templateId}`),
                fetch(`/api/products`),
            ]);

            const template = await templateRes.json();
            const products = await productRes.json();

            if (template.success) {
                const loadedDesign = {
                    ...defaultDesign,
                    ...template.data,
                };

                setDesign(loadedDesign);

                // IMPORTANT
                onChange?.(loadedDesign);
            }

            if (products.status === 1 && products.variants?.length) {
                const first = products.variants[0];

                setPreviewItem({
                    title: first.product_title,
                    sku: first.current_sku || "NO SKU",
                    price: first.price,
                    vendor: first.vendor,
                    option_1:
                        first.variant_title !== "Default Title"
                            ? first.variant_title
                            : "",
                    online_url: first.online_url || "",
                });
            }
        } catch (err) {
            console.error(err);
            setError("Unable to load design.");
        } finally {
            setLoading(false);
        }
    }

    function updateField(key, value) {
        setDesign(prev => {
            const updated = {
                ...prev,
                [key]: value,
            };

            onChange?.(updated);
            onDirty?.();

            return updated;
        });
    }
    const handlePrint = () => {
        const printContents = printRef.current.innerHTML;

        const printWindow = window.open("", "", "width=800,height=600");

        printWindow.document.write(`
    <html>
      <head>
        <title>Print Label</title>
        <style>
          body{
            margin:20px;
            display:flex;
            justify-content:center;
            align-items:center;
            font-family:Arial,sans-serif;
          }

          .label{
            border:1px solid #ddd;
            padding:20px;
            text-align:center;
            width:250px;
          }

          svg{
            max-width:100%;
          }
        </style>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

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
                        <p>{error}</p>
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
                        ref={printRef}
                        className="label"
                        style={{
                            background: "#fff",
                            border: "1px solid #d9d9d9",
                            borderRadius: "6px",
                            padding: "20px",
                            textAlign: "center",
                        }}
                    >

                        {design.line1_sku && (
                            <div
                                style={{
                                    fontFamily: "monospace",
                                    fontSize: 14,
                                    marginBottom: 5,
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
                                        fontSize: 16,
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
                                            color: "#666",
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
                                        fontWeight: "bold",
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
                                    fontSize: 13,
                                }}
                            >
                                {previewItem.vendor}
                            </div>
                        )}

                        {design.symbol_enabled && (
                            <Box paddingBlockStart="400">
                                {design.symbol_type === "BARCODE" ? (
                                    <BarcodeRenderer
                                        value={previewItem.sku}
                                        settings={design}
                                    />
                                ) : (
                                    <QrCodeRenderer
                                        value={previewItem.sku}
                                        settings={design}
                                    />
                                )}
                            </Box>
                        )}

                    </div>
                </Card>
                <Box paddingBlockStart="400">
                    <button
                        onClick={handlePrint}
                        style={{
                            background: "#008060",
                            color: "#fff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                        }}
                    >
                        🖨 Print Label
                    </button>
                </Box>
            </BlockStack>
        </Card>
    );
}
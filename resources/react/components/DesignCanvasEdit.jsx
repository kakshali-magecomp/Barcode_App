import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    Card,
    BlockStack,
    Banner,
    Spinner,
    Box,
    Select,
    TextField,
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

    const [storeVariants, setStoreVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState("");
    const [printSettings, setPrintSettings] = useState({});
    useEffect(() => {
        loadDesign();
    }, [templateId]);

    async function loadDesign() {
        try {
            setLoading(true);

            const [templateRes, productRes, settingRes] = await Promise.all([
                fetch(`/api/templates/design/${templateId}`),
                fetch(`/api/products`),
                fetch(`/api/print-settings`),
            ]);
            const template = await templateRes.json();
            console.log("Template:", template.data);
            console.log("Template print_qty:", template.data.print_qty);
            const products = await productRes.json();
            const settings = await settingRes.json();
            console.log("PRINT SETTINGS:", settings);
            let defaultQty = 1;

            if (settings.success) {
                setPrintSettings(settings.settings);

                defaultQty =
                    settings.settings.default_print_label_quantity || 1;
            }

            if (template.success) {
                const loadedDesign = {
                    ...defaultDesign,
                    ...template.data,
                    print_qty: defaultQty,
                };
                setDesign(loadedDesign);

                // IMPORTANT
                onChange?.(loadedDesign);
            }

            if (products.status === 1 && products.variants?.length) {

                setStoreVariants(products.variants);
                const savedVariantId =
                    template.data?.selected_variant_id || "";

                const selected =
                    products.variants.find(
                        item => item.variant_id === savedVariantId
                    ) || products.variants[0];

                setSelectedVariantId(selected.variant_id);

                setPreviewItem({
                    title: selected.product_title,
                    sku: selected.current_sku || "NO SKU",
                    barcode: selected.barcode || "",
                    price: selected.price,
                    vendor: selected.vendor,
                    option_1:
                        selected.variant_title !== "Default Title"
                            ? selected.variant_title
                            : "",
                    online_url: selected.online_url || "",
                    barcode: selected.barcode || "",
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

        const qty = Number(design.print_qty) || 1;
        let labels = "";

        for (let i = 0; i < qty; i++) {
            labels += `
            <div class="label">
                ${printRef.current.innerHTML}
            </div>
        `;
        }

        const printWindow = window.open("", "", "width=900,height=700");

        printWindow.document.write(`
<html>
<head>

<title>Print Label</title>

<style>

body{
    margin:20px;
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    font-family:Arial,sans-serif;
}

.label{
    width:250px;
    border:1px solid #ddd;
    padding:20px;
    page-break-inside:avoid;
}

svg{
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
    const getSymbolTargetValue = () => {

    switch (design.symbol_field_source) {

        case "product_name":
            return previewItem.title || "";

        case "product_price":
            return previewItem.price || "";

        case "product_online_url":
            return previewItem.online_url || "";

        case "barcode_value":
            return previewItem.barcode || "";

        case "sku_value":
            return previewItem.sku || "";

        case "barcode":
            return previewItem.barcode || "";

        default:
            return previewItem.sku || "";
    }
};

    return (
        <Card padding="500">
            <BlockStack gap="500">

                {error && (
                    <Banner tone="critical">
                        <p>{error}</p>
                    </Banner>
                )}
                <Card padding="400">
                    <Select
                        label="Preview Product"

                        options={storeVariants.map(item => ({
                            label: `${item.product_title} (${item.current_sku || "No SKU"})`,
                            value: item.variant_id,
                        }))}

                        value={selectedVariantId}

                        onChange={(value) => {

                            setSelectedVariantId(value);

                            const selected = storeVariants.find(
                                item => item.variant_id === value
                            );

                            if (!selected) return;

                            setPreviewItem({
                                title: selected.product_title,
                                sku: selected.current_sku || "NO SKU",
                                barcode: selected.barcode || "",
                                price: selected.price,
                                vendor: selected.vendor,
                                option_1:
                                    selected.variant_title !== "Default Title"
                                        ? selected.variant_title
                                        : "",
                                online_url: selected.online_url || "",
                                barcode: selected.barcode||"",
                            });

                            // save selected variant into design
                            updateField("selected_variant_id", value);
                        }}
                    />

                </Card>

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
                                        value={getSymbolTargetValue()}
                                        settings={design}
                                    />
                                ) : 
                                
                                (
                                    <QrCodeRenderer
                                        value={getSymbolTargetValue()}
                                        settings={design}
                                    />
                                )}
                            </Box>
                        )}
                        {design.barcode && (
                            <div style={{
                                    marginTop: 5,
                                    fontSize: 13,
                                }}>
                                    {previewItem.barcode}
                                </div>
                        )}

                    </div>
                </Card>
                <Box paddingBlockStart="400">
                    <TextField
                        label="Print Quantity"
                        type="number"
                        value={String(design.print_qty || 1)}
                        onChange={(value) =>
                            updateField(
                                "print_qty",
                                Math.max(1, parseInt(value) || 1)
                            )
                        }
                        autoComplete="off"
                    />
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
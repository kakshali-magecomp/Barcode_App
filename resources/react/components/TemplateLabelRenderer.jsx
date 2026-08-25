import React from "react";
import BarcodeRenderer from "./BarcodeRenderer";
import QrCodeRenderer from "./QrCodeRenderer";

export default function TemplateLabelRenderer({
    design = {},
    product,
    barcodeSettings = {},
    formatPrice,
    printMode = false,
    barcodeValue = null,
}) {
    if (!product) return null;

    const variantTitle =
        product.variant_title &&
            product.variant_title.trim() !== "" &&
            product.variant_title.trim().toLowerCase() !== "default title"
            ? product.variant_title.trim()
            : "";

    const option1 =
        product.option_1 &&
            product.option_1.trim() !== "" &&
            product.option_1.trim().toLowerCase() !== "default title"
            ? product.option_1.trim()
            : "";

    const previewItem = {
        title: product.product_title || product.title || "",

        sku:
            product.current_sku ||
            product.sku ||
            "",

        barcode:
            barcodeValue !== null && barcodeValue !== undefined
                ? String(barcodeValue)
                : product.current_barcode ||
                product.barcode ||
                "",

        price:
            product.price ?? "",

        vendor:
            product.vendor || "",

        option_1: variantTitle || option1,

        online_url:
            product.online_url || "",
    };

    const displayPrice = formatPrice
        ? String(formatPrice(product))
        : String(previewItem.price ?? "");

    const getSymbolValue = () => {
        switch (design.symbol_field_source) {
            case "product_name":
                return previewItem.title;

            case "product_price":
                return displayPrice;

            case "product_online_url":
                return previewItem.online_url;

            case "barcode_value":
            case "barcode":
                return previewItem.barcode;

            case "sku_value":
            case "sku":
                return previewItem.sku;

            default:
                return previewItem.sku;
        }
    };

    return (
        <div
            className="template-label-content"
            style={{
                width: "100%",
                height: "100%",


                minHeight: printMode ? 0 : 220,

                boxSizing: "border-box",

                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",

                textAlign: "center",

                overflow: "hidden",

                background: "#fff",
                padding: printMode
                    ? "2mm"
                    : "20px",
            }}
        >


            {design.line1_sku && (
                <div
                    style={{
                        fontWeight: 600,
                        marginBottom: printMode
                            ? "1mm"
                            : 8,
                        fontSize: printMode
                            ? undefined
                            : 14,
                    }}
                >
                    {previewItem.sku}
                </div>
            )}



            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",

                    gap: printMode
                        ? "1mm"
                        : 6,

                    marginBottom: printMode
                        ? "2mm"
                        : 20,

                    maxWidth: "100%",
                }}
            >
                {design.line2_name && (
                    <span
                        style={{
                            fontWeight: 700,

                            fontSize: printMode
                                ? undefined
                                : 16,
                        }}
                    >
                        {previewItem.title}
                    </span>
                )}

                {design.line2_variant_option1 &&
                    previewItem.option_1 && (
                        <span
                            style={{
                                color: "#666",
                            }}
                        >
                            • {previewItem.option_1}
                        </span>
                    )}

                {design.line2_price && (
                    <span
                        style={{
                            color: "#000",
                            fontWeight: 700,
                        }}
                    >
                        {displayPrice}
                    </span>
                )}
            </div>



            {design.line3_vendor && (
                <div
                    style={{
                        marginBottom: printMode
                            ? "1mm"
                            : 12,

                        color: "#666",
                    }}
                >
                    {previewItem.vendor}
                </div>
            )}


            {design.symbol_enabled && (
                design.symbol_type === "BARCODE" ? (
                    <BarcodeRenderer
                        value={getSymbolValue()}
                        field={
                            design.symbol_field_source
                        }
                        settings={design}
                        barcodeSettings={{
                            ...(barcodeSettings?.data ??
                                barcodeSettings),

                            ...design,
                        }}
                        printMode={printMode}
                    />
                ) : (
                    <QrCodeRenderer
                        value={getSymbolValue()}
                        settings={design}
                        printMode={printMode}
                    />
                )
            )}
        </div>
    );
}
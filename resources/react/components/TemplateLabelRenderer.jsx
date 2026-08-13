import React from "react";
import BarcodeRenderer from "./BarcodeRenderer";
import QrCodeRenderer from "./QrCodeRenderer";

export default function TemplateLabelRenderer({
    design = {},
    product,
    barcodeSettings = {},
    formatPrice,
    printMode = false,
}) {
    if (!product) return null;

    const previewItem = {
        title: product.product_title || product.title || "",

        sku:
            product.current_sku ||
            product.sku ||
            "",

        barcode:
            product.barcode ||
            product.current_barcode ||
            "",

        price:
            product.price ?? "",

        vendor:
            product.vendor || "",

        option_1:
            product.variant_title &&
            product.variant_title !== "Default Title"
                ? product.variant_title
                : product.option_1 || "",

        online_url:
            product.online_url || "",
    };

    const getSymbolValue = () => {
        switch (design.symbol_field_source) {
            case "product_name":
                return previewItem.title;

            case "product_price":
                return String(previewItem.price);

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

                /*
                 * Don't use large screen padding while printing.
                 */
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
                        {formatPrice
                            ? formatPrice(
                                  previewItem.price
                              )
                            : previewItem.price}
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
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
            product.current_barcode ||
            product.barcode ||
            product.generated_barcode ||
            "",

        price:
            product.price ?? "",

        vendor:
            product.vendor || "",

        option_1: variantTitle || option1,

        online_url:
            product.online_url || (product.handle ? `/products/${product.handle}` : ""),
    };

    const displayPrice = formatPrice
        ? String(formatPrice(product))
        : String(previewItem.price ?? "");

    const getSymbolValue = () => {
        if (barcodeValue !== null && barcodeValue !== undefined && String(barcodeValue).trim() !== "") {
            return String(barcodeValue).trim();
        }

        const fieldSource = design.symbol_field_source || "barcode_value";
        switch (fieldSource) {
            case "product_name":
            case "title":
            case "name":
                return String(previewItem.title || "Product Name").trim();

            case "product_price":
            case "price":
                return String(displayPrice || "0.00").trim();

            case "product_online_url":
            case "product_page_url":
            case "online_url":
            case "url": {
                const params = new URLSearchParams(window.location.search);
                const shopDomain = params.get('shop') || window.shopify?.config?.shop || 'kakshalijani.myshopify.com';
                let rawUrl = previewItem.online_url || product.online_url || product.url || "";
                if (rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) && !rawUrl.includes("store.myshopify.com")) {
                    return rawUrl.trim();
                }
                const handle = product.handle || (previewItem.title || product.product_title || "product").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
                const variantParam = product.variant_id ? `?variant=${product.variant_id}` : "";
                if (rawUrl && rawUrl.startsWith("/")) {
                    return `https://${shopDomain}${rawUrl}${variantParam}`.trim();
                }
                return `https://${shopDomain}/products/${handle}${variantParam}`.trim();
            }

            case "product_vendor":
            case "vendor":
                return String(previewItem.vendor || "Vendor").trim();

            case "sku_value":
            case "product_sku":
            case "sku":
                return String(previewItem.sku || previewItem.barcode || "SKU-EMPTY").trim();

            case "barcode_value":
            case "barcode":
            default:
                return String(previewItem.barcode || previewItem.sku || previewItem.title || "123456789012").trim();
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
                padding: printMode ? "1.5mm" : "12px",
                gap: printMode ? "0.8mm" : "6px",
            }}
        >
            {design.line1_sku && (
                <div
                    className="print-sku"
                    style={{
                        fontWeight: 700,
                        margin: 0,
                        padding: 0,
                        fontSize: printMode ? undefined : 13,
                        wordBreak: "break-all",
                        whiteSpace: "normal",
                        maxWidth: "100%",
                        lineHeight: 1.2,
                    }}
                >
                    {previewItem.sku}
                </div>
            )}

            <div
                className="print-line2"
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: printMode ? "0.6mm" : 6,
                    margin: 0,
                    padding: 0,
                    maxWidth: "100%",
                    lineHeight: 1.2,
                }}
            >
                {design.line2_name && (
                    <span
                        className="print-title"
                        style={{
                            fontWeight: 700,
                            fontSize: printMode ? undefined : 14,
                        }}
                    >
                        {previewItem.title}
                    </span>
                )}

                {design.line2_variant_option1 &&
                    previewItem.option_1 && (
                        <span
                            className="print-variant"
                            style={{
                                color: "#666",
                            }}
                        >
                            • {previewItem.option_1}
                        </span>
                    )}

                {design.line2_price && (
                    <span
                        className="print-price"
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
                    className="print-vendor"
                    style={{
                        margin: 0,
                        padding: 0,
                        fontWeight: 500,
                        color: "#666",
                        lineHeight: 1.2,
                    }}
                >
                    {previewItem.vendor}
                </div>
            )}


            {(design.symbol_enabled !== false && String(design.symbol_enabled) !== 'false') && (
                (String(design.symbol_type || 'BARCODE').toUpperCase() === 'BARCODE') ? (
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
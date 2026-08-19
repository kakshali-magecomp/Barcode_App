import React, { useEffect, useState, useRef } from "react";
import LineControls from "../components/LineControls";
import SymbolControls from "../components/SymbolControls";
import BarcodeRenderer from "../components/BarcodeRenderer";
import QrCodeRenderer from "../components/QrCodeRenderer";
import { openPrintWindow } from "./Printlayout";

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
    discardSignal,
    paperTemplate,
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
    const [barcodeSettings, setBarcodeSettings] = useState({});
    const initialLoadCompleted = useRef(false);

    useEffect(() => {
        loadDesign();
    }, [templateId, discardSignal]);

    async function loadDesign() {
        try {
            setLoading(true);

            const [templateRes, productRes, settingRes, barcodeRes] = await Promise.all([
                fetch(`/api/templates/design/${templateId}`),
                fetch(`/api/products`),
                fetch(`/api/print-settings`),
                fetch(`/api/barcode-settings`),
            ]);
            const template = await templateRes.json();
            const products = await productRes.json();
            const settings = await settingRes.json();
            const barcode = await barcodeRes.json();

            if (barcode.success) {
                setBarcodeSettings(barcode.settings || barcode.data || barcode);
            }

            let defaultQty = 1;

            if (settings.success) {
                setPrintSettings(settings.settings);
                defaultQty = settings.settings.default_print_label_quantity || 1;
            }

            if (template.success) {
                const loadedDesign = {
                    ...defaultDesign,
                    ...(barcode.settings || barcode.data || {}),
                    ...template.data,
                    print_qty:
                        template.data?.print_qty ??
                        defaultQty,
                };

                if (loadedDesign.line2_currency_format) {
                    loadedDesign.line2_currency_format =
                        loadedDesign.line2_currency_format
                            .replace(/\{\{amount\}\}/gi, "{amount}")
                            .replace(/\$amount/gi, "${amount}")
                            .trim();
                }

                setDesign(loadedDesign);
                initialLoadCompleted.current = true;
            }

            if (products.status === 1 && products.variants?.length) {
                setStoreVariants(products.variants);
                const savedVariantId = template.data?.selected_variant_id || "";
                const selected =
                    products.variants.find((item) => item.variant_id === savedVariantId) ||
                    products.variants[0];

                setSelectedVariantId(selected.variant_id);
                setPreviewItem({
                    title: selected.product_title,
                    sku: selected.current_sku || "NO SKU",
                    barcode: selected.barcode || "",
                    price: selected.price,
                    vendor: selected.vendor,
                    option_1:
                        selected.variant_title !== "Default Title" ? selected.variant_title : "",
                    online_url: selected.online_url || "",
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
        setDesign((prev) => {
            if (prev[key] === value) {
                return prev;
            }

            const updated = { ...prev, [key]: value };

            if (initialLoadCompleted.current) {
                onChange?.(updated);
                onDirty?.();
            }

            return updated;
        });
    }

    const handlePrint = () => {
        if (!printRef.current) {
            console.error('Print reference is not available');
            shopify.toast.show("Print preview not ready. Please try again.", {
                duration: 5000,
                isError: true,
            });
            return;
        }

        const qty = Math.max(1, Number(design.print_qty) || 1);

        // Get paper template - check multiple possible sources
        let paper = paperTemplate ||
            design.layout_settings ||
            design.paper_template ||
            PAPER_TEMPLATES?.[brand]?.[model];

        // If still no paper, try to get from design
        if (!paper && design.paper_brand && design.paper_model) {
            paper = PAPER_TEMPLATES?.[design.paper_brand]?.[design.paper_model];
        }

        // Validate paper template
        if (!paper) {
            shopify.toast.show("Please select a brand and paper model for printing.", {
                duration: 5000,
                isError: true,
            });
            return;
        }

        // Ensure paper has required properties
        if (!paper.label || !paper.label.width || !paper.label.height) {
            console.error('Invalid paper template:', paper);
            shopify.toast.show("Invalid paper template. Please select a valid paper model.", {
                duration: 5000,
                isError: true,
            });
            return;
        }

        // Get the preview HTML content
        let labelHtml = printRef.current.innerHTML;

        // Add proper classes and structure for print
        labelHtml = `
        <div class="label-content">
            ${labelHtml}
        </div>
    `;

        // Create sheets with proper grid layout
        const rows = Number(paper.rows || 1);
        const columns = Number(paper.columns || 1);
        const labelsPerSheet = rows * columns;

        let sheets = [];

        // For roll labels (single label per sheet)
        if (paper.type === 'roll' || (rows === 1 && columns === 1)) {
            // Each label on its own sheet
            for (let i = 0; i < qty; i++) {
                sheets.push(`
                <div class="print-sheet">
                    <div class="label">
                        ${labelHtml}
                    </div>
                </div>
            `);
            }
        } else {
            // Sheet labels (multiple labels per sheet)
            for (let start = 0; start < qty; start += labelsPerSheet) {
                const labelsOnThisSheet = Math.min(labelsPerSheet, qty - start);
                let labels = '';
                for (let i = 0; i < labelsOnThisSheet; i++) {
                    labels += `
                    <div class="label">
                        ${labelHtml}
                    </div>
                `;
                }
                sheets.push(`
                <div class="print-sheet">
                    ${labels}
                </div>
            `);
            }
        }

        const bodyHtml = sheets.join("");

        // Log for debugging
        console.log('Printing with paper template:', paper);
        console.log('Quantity:', qty);
        console.log('Labels per sheet:', labelsPerSheet);

        // Open print window with all necessary settings
        const success = openPrintWindow({
            bodyHtml,
            paperTemplate: paper,
            useJsBarcodeScript: true,
            fontOptions: {
                fontFactor: 0.14,
                fontMin: 3.5,
                fontMax: 7,
            },
            onAfterPrint: () => {
                // Optional: log print completion
                console.log('Print completed');
            },
        });

        if (!success) {
            shopify.toast.show("Failed to open print window. Please allow popups for this website.", {
                duration: 5000,
                isError: true,
            });
        }
    };


    if (loading) {
        return (
            <s-box padding="base">
                <s-spinner accessibilityLabel="Loading design canvas" />
            </s-box>
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

    const formatPrice = (price) => {
        const decimals = Number(
            printSettings?.price_decimal_number ?? 2
        );

        // Shopify price
        let originalPrice = Number(price ?? 0);

        if (!Number.isFinite(originalPrice)) {
            originalPrice = 0;
        }

        // Only convert if your API actually returns cents
        if (originalPrice > 999) {
            originalPrice = originalPrice / 100;
        }

        // VAT
        const vatPercentage = Number(
            printSettings?.vat_percentage ?? 0
        );

        const priceWithVat =
            originalPrice +
            (originalPrice * vatPercentage) / 100;

        const amount = priceWithVat.toFixed(decimals);


        // TEMPLATE FORMAT HAS FIRST PRIORITY


        let templateFormat = String(
            design?.line2_currency_format ?? ""
        ).trim();

        // Fix old saved formats
        templateFormat = templateFormat
            .replace(/\{\{amount\}\}/gi, "{amount}")
            .replace(/\$\{amount\}\}/gi, "{amount} USD");

        // If template has {amount}, ALWAYS use it.
        if (templateFormat.includes("{amount}")) {
            return templateFormat.replace(
                /\{amount\}/g,
                amount
            );
        }


        // GLOBAL PRINT SETTING


        const globalFormat =
            printSettings?.currency_format ?? "without_currency";

        if (globalFormat === "currency_code") {
            return `${amount} USD`;
        }

        if (globalFormat === "with_currency") {
            return `$${amount}`;
        }

        return amount;
    };

    return (
        <s-box paddingBlockStart="base">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>

                {/* LEFT SIDE */}
                <s-stack direction="block" gap="loose" style={{ paddingRight: "340px" }}>
                    {error && (
                        <s-banner tone="critical">
                            {error}
                        </s-banner>
                    )}

                    <s-section>
                        <s-select
                            label="Preview Product"
                            value={selectedVariantId}
                            onChange={(event) => {
                                const value = event.currentTarget.value;
                                setSelectedVariantId(value);
                                const selected = storeVariants.find(
                                    (item) => item.variant_id === value
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
                                });
                                updateField("selected_variant_id", value);
                            }}
                        >
                            {storeVariants.map((item) => (
                                <s-option key={item.variant_id} value={item.variant_id}>
                                    {`${item.product_title} (${item.barcode || "No barcode"})`}
                                </s-option>
                            ))}
                        </s-select>
                    </s-section>

                    <LineControls design={design} handleUpdate={updateField} />
                    <SymbolControls design={design} handleUpdate={updateField} />
                </s-stack>

                {/* RIGHT SIDE */}
                <div
                    style={{
                        position: "fixed",
                        top: "140px",
                        right: "90px",
                        width: "300px",
                        maxHeight: "calc(100vh - 185px)",
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #e1e3e5",
                        borderRadius: "12px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        padding: "16px",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Preview */}
                        <div>
                            <div
                                ref={printRef}
                                style={{
                                    minHeight: '220px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                }}
                            >
                                {design.line1_sku && (
                                    <div>
                                        {previewItem.sku}
                                    </div>
                                )}
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    gap: 6,
                                    marginBottom: 5,
                                }}>
                                    {design.line2_name && (
                                        <span style={{ fontWeight: 700 }}>
                                            {previewItem.title}
                                        </span>
                                    )}
                                    {design.line2_variant_option1 && previewItem.option_1 && (
                                        <span style={{color: "#666" }}>
                                            {previewItem.option_1}
                                        </span>
                                    )}
                                    {design.line2_price && (
                                        <span style={{ color: "#000000", fontWeight: 700 }}>
                                            {formatPrice(previewItem.price)}
                                        </span>
                                    )}
                                </div>
                                {design.line3_vendor && (
                                    <div style={{ fontWeight: 500 , color: "#777" }}>
                                        {previewItem.vendor}
                                    </div>
                                )}
                                {design.symbol_enabled && (
                                    design.symbol_type === "BARCODE" ? (
                                        <BarcodeRenderer
                                            value={getSymbolTargetValue()}
                                            settings={design}
                                            barcodeSettings={{
                                                ...barcodeSettings,
                                                barcode_format:
                                                    design.barcode_format || barcodeSettings.barcode_format,
                                                ...design,
                                            }}
                                        />
                                    ) : (
                                        <QrCodeRenderer value={getSymbolTargetValue()} settings={design} />
                                    )
                                )}
                                {design.barcode && (
                                    <div style={{ marginTop: 12, fontWeight: 600 }}>
                                        {previewItem.barcode}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Print */}
                        <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                                <s-number-field
                                    label="Print Quantity"
                                    value={String(design.print_qty || 1)}
                                    min="1"
                                    step="1"
                                    onInput={(event) =>
                                        updateField(
                                            "print_qty",
                                            Math.max(1, parseInt(event.currentTarget.value) || 1)
                                        )
                                    }
                                />
                                <s-button variant="primary" icon="print" onClick={handlePrint}>
                                    Print Label
                                </s-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </s-box>
    );
}
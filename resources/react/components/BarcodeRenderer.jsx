import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import {
    detectBarcodeFormat,
    getBarcodeValue,
} from "./barcode/BarcodeUtils";

export default function BarcodeRenderer({
    value,
    field,
    settings = {},
    barcodeSettings = {},
}) {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (!barcodeRef.current || value == null || value === "") {
            return;
        }


        // Detect barcode format from template settings
        let format = detectBarcodeFormat(value, barcodeSettings);

        // Normalize format names for JsBarcode
        switch (format) {
            case "Code39":
            case "CODE39":
                format = "CODE39";
                break;

            case "UPCA":
            case "UPC":
                format = "UPC";
                break;

            case "EAN8":
                format = "EAN8";
                break;

            case "EAN13":
                format = "EAN13";
                break;

            case "ITF14":
                format = "ITF14";
                break;

            default:
                format = "CODE128";
        }

        // Generate barcode value
        let barcodeValue = getBarcodeValue(
            value,
            barcodeSettings,
            field
        );
        console.log("FORMAT =", format);
        console.log("VALUE =", barcodeValue);
        console.log("SETTINGS =", barcodeSettings);


        // Numeric barcode validation
        if (
            ["EAN8", "EAN13", "UPCA", "ITF14"].includes(format)
        ) {
            if (!/^\d+$/.test(barcodeValue)) {
                console.warn(
                    `${format} only supports numeric values. Falling back to CODE128`
                );

                format = "CODE128";
                barcodeValue = String(value);
            }
        }

        console.log("Final Format :", format);
        console.log("Final Barcode :", barcodeValue);

        try {
            JsBarcode(barcodeRef.current, barcodeValue, {
                format,
                width: Number(settings.symbol_bar_width) || 2,
                height: Number(settings.symbol_bar_height) || 50,
                margin: Number(settings.symbol_margin_px) || 2,

                displayValue: !settings.hide_barcode_value,

                fontSize: Number(settings.symbol_font_size) || 16,

                lineColor:
                    settings.symbol_color || "#000000",

                background: "#FFFFFF",
            });
        } catch (err) {
            console.error("Barcode Error");
            console.error(err);

            console.log({
                value,
                barcodeValue,
                format,
                barcodeSettings,
            });

            // Last fallback
            try {
                JsBarcode(barcodeRef.current, String(value), {
                    format: "CODE128",
                    width: Number(settings.symbol_bar_width) || 2,
                    height: Number(settings.symbol_bar_height) || 50,
                    margin: Number(settings.symbol_margin_px) || 2,
                    displayValue: !settings.hide_barcode_value,
                    fontSize: Number(settings.symbol_font_size) || 16,
                    lineColor:
                        settings.symbol_color || "#000000",
                    background: "#FFFFFF",
                });
            } catch (e) {
                console.error("Fallback failed", e);
            }
        }
    }, [value, field, settings, barcodeSettings]);

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <img
    ref={barcodeRef}
    alt="Barcode"
    style={{
        maxWidth: "100%",
        width: "auto",
        height: "auto",
        display: "block",
        objectFit: "contain",
    }}
/>
        </div>
    );
}
import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { detectBarcodeFormat } from "./barcode/BarcodeUtils";

export default function BarcodeRenderer({
    value,
    settings = {},
    barcodeSettings = {},
}) {

    const barcodeRef = useRef(null);

    useEffect(() => {
        console.log("BarcodeRenderer Loaded");
        console.log("value =", value);
        console.log("settings =", settings);
        console.log("barcodeSettings =", barcodeSettings);

        if (!barcodeRef.current || !value) return;

        const format = detectBarcodeFormat(
            value,
            barcodeSettings
        );

        console.log("Barcode Format:", format);
        console.log("Barcode Value:", value);
        console.log("Barcode Settings:", barcodeSettings);

        try {

            JsBarcode(barcodeRef.current, value, {
                format: format,
                width: Number(settings.symbol_bar_width) || 2,
                height: Number(settings.symbol_bar_height) || 40,
                displayValue: !settings.hide_barcode_value,
                fontSize: Number(settings.symbol_font_size) || 12,
                lineColor: settings.symbol_color || "#000000",
                margin: 0,
            });

        } catch (err) {
            console.error("BARCODE ERROR");
            console.error(err);
            console.log("Value:", value);
            console.log("Format:", format);
            console.log("Barcode Settings:", barcodeSettings);
        }

    }, [value, settings, barcodeSettings]);

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
            style={{
                maxWidth: "100%",
                height: "auto",
            }}
        />
    </div>
);
}
import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { detectBarcodeFormat, getBarcodeValue, } from "./barcode/BarcodeUtils";

export default function BarcodeRenderer({
    value,
    field,
    settings = {},
    barcodeSettings = {},
}) {

    const barcodeRef = useRef(null);
    useEffect(() => {
        console.log("BarcodeRenderer Loaded");
        console.log("value =", value);
        console.log("settings =", settings);
        console.log("barcodeSettings =", barcodeSettings);
        console.log("Selected Field =", field);
        
        if (!barcodeRef.current || !value) return;

        let format = detectBarcodeFormat(
            value,
            barcodeSettings
        );


        if (
            ["EAN8", "EAN13", "UPCA", "ITF14"].includes(format)
        ) {
            const digits = String(value).replace(/\D/g, "");

            if (!digits.length) {
                format = "CODE128";
            }
        }

        const barcodeValue = getBarcodeValue(
            value,
            barcodeSettings,
            field
        );

        console.log("Barcode Format:", format);
        console.log("Barcode Value:", value);
        console.log("Barcode Settings:", barcodeSettings);
        console.log("Barcode value:", barcodeValue);
        console.log("Selected Format:", barcodeSettings.barcode_format);
        try {

            JsBarcode(barcodeRef.current, barcodeValue, {
                format: format,
                width: 4,
                height: 80,
                displayValue: !settings.hide_barcode_value,
                fontSize: 18,
                lineColor: "#000000",
                background: "#FFFFFF",
                margin: 20,
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
                    width: "320px",
                    height: "120px",
                    imageRendering: "pixelated",
                }}
            />
        </div>
    );
}
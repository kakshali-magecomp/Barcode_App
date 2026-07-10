import React, { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

export default function BarcodeRenderer({
    value,
    settings = {},
}) {
    const barcodeRef = useRef(null);

    const [barcodeSettings, setBarcodeSettings] = useState(null);

    useEffect(() => {
        loadBarcodeSettings();
    }, []);

    async function loadBarcodeSettings() {
        try {
            const res = await fetch("/api/barcode-settings");

            const data = await res.json();

            setBarcodeSettings(data);

        } catch (e) {
            console.error(e);
        }
    }

    function generateRandomBarcode(pattern) {

        if (!pattern) return value;

        const match = pattern.match(/\[([AN])\.(\d+)\]/);

        if (!match) return value;

        const type = match[1];

        const length = parseInt(match[2]);

        let result = "";

        const numbers = "0123456789";
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for (let i = 0; i < length; i++) {

            if (type === "N") {

                result += numbers[Math.floor(Math.random() * numbers.length)];

            } else {

                result += letters[Math.floor(Math.random() * letters.length)];

            }

        }

        return result;
    }

    function detectFormat(barcode) {

        switch (barcode.length) {

            case 8:
                return "EAN8";

            case 12:
                return "UPCA";

            case 13:
                return "EAN13";

            default:
                return barcodeSettings?.barcode_format || "CODE128";
        }

    }

    function getBarcodeValue() {

        let barcode =
            barcodeSettings?.barcode_pattern
                ? generateRandomBarcode(barcodeSettings.barcode_pattern)
                : String(value);

        if (barcodeSettings?.prevent_zero_start_end) {

            while (
                barcode.startsWith("0") ||
                barcode.endsWith("0")
            ) {

                barcode =
                    generateRandomBarcode(
                        barcodeSettings.barcode_pattern
                    );

            }

        }

        return barcode;
    }

    useEffect(() => {

        if (!barcodeRef.current) return;

        const barcodeValue = getBarcodeValue();

        try {
            const format =
                barcodeSettings?.auto_detect_gtin_format
                    ? detectFormat(barcodeValue)
                    : barcodeSettings?.barcode_format || "CODE128";

            console.log("Barcode Format:", format);
            console.log("Barcode Value:", barcodeValue);
            JsBarcode(barcodeRef.current, barcodeValue, {

                format: format,

                width:
                    parseInt(settings.symbol_bar_width) || 2,

                height:
                    parseInt(settings.symbol_bar_height) || 40,

                displayValue:
                    !settings.hide_barcode_value,

                fontSize:
                    parseInt(settings.symbol_font_size) || 12,

                lineColor:
                    settings.symbol_color || "#000000",

                margin: 0,

            });

        } catch (err) {

            console.error(err);

        }

    }, [value, settings, barcodeSettings]);

    return (
        <div
            style={{
                textAlign: "center",
            }}
        >
            <svg ref={barcodeRef}></svg>
        </div>
    );
}
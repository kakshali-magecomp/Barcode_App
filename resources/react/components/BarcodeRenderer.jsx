import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

import {
    generateBarcode,
    detectBarcodeFormat,
} from "./barcode/BarcodeUtils"; 

export default function BarcodeRenderer({
    value,
    settings = {},
    barcodeSettings = null,
}) {

    const barcodeRef = useRef(null);

    useEffect(() => {

        if (!barcodeRef.current) return;

        const barcodeValue = generateBarcode(
            { barcode: value },
            barcodeSettings
        );

        const format = detectBarcodeFormat(
            barcodeValue,
            barcodeSettings
        );

        try {

            JsBarcode(barcodeRef.current, barcodeValue, {

                format,

                width:
                    Number(settings.symbol_bar_width) || 2,

                height:
                    Number(settings.symbol_bar_height) || 40,

                displayValue:
                    !settings.hide_barcode_value,

                fontSize:
                    Number(settings.symbol_font_size) || 12,

                lineColor:
                    settings.symbol_color || "#000000",

                margin: 0,

            });

        } catch (err) {

            console.error("Barcode Error:", err);

        }

    }, [value, settings, barcodeSettings]);

    return (
        <div style={{ textAlign: "center" }}>
            <svg ref={barcodeRef}></svg>
        </div>
    );

}
import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

import { detectBarcodeFormat } from "./barcode/BarcodeUtils";

export default function BarcodeRenderer({
    value,
    settings = {},
    barcodeSettings = null,
}) {

    const barcodeRef = useRef(null);

    useEffect(() => {

        if (!barcodeRef.current || !value) return;

        const format = detectBarcodeFormat(
            value,
            barcodeSettings
        );

        try {

            JsBarcode(barcodeRef.current, value, {

                format,

                width: Number(settings.symbol_bar_width) || 2,

                height: Number(settings.symbol_bar_height) || 40,

                displayValue: !settings.hide_barcode_value,

                fontSize: Number(settings.symbol_font_size) || 12,

                lineColor: settings.symbol_color || "#000000",

                margin: 0,

            });

        } catch (err) {

            console.error(err);

        }

    }, [value, settings, barcodeSettings]);

    return (
        <div style={{ textAlign: "center" }}>
            <svg ref={barcodeRef}></svg>
        </div>
    );
}
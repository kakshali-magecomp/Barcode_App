import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

export default function BarcodeRenderer({ value, settings = {} }) {
    const barcodeCanvasRef = useRef(null);

    useEffect(() => {
        if (!barcodeCanvasRef.current || !value) return;

        try {
            // FIXED: If hide_barcode_value is true, displayValue turns false instantly
            const shouldDisplayValue = !settings.hide_barcode_value;

            JsBarcode(barcodeCanvasRef.current, String(value), {
                format: settings.symbol_barcode_format || "CODE128",
                width: parseInt(settings.symbol_bar_width) || 2,
                height: parseInt(settings.symbol_bar_height) || 35,
                displayValue: shouldDisplayValue,
                fontSize: parseInt(settings.symbol_font_size) || 12,
                lineColor: settings.symbol_color || "#000000",
                margin: 0
            });
        } catch (err) {
            console.error("Barcode data string formatting error:", err);
        }
    }, [value, settings]);

    return (
        <div style={{ display: 'block', margin: '0 auto', textAlign: 'center' }}>
            <svg ref={barcodeCanvasRef}></svg>
        </div>
    );
}

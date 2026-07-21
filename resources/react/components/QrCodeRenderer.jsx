import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrCodeRenderer({ value, settings = {} }) {
    const [renderedDataUrl, setRenderedDataUrl] = useState('');

    useEffect(() => {
    
    if (!value) {
        setRenderedDataUrl("");
        return;
    }

    QRCode.toDataURL(String(value), {

        width: parseInt(settings.symbol_width_px) || 140,

        margin: parseInt(settings.symbol_margin_px) || 2,

        color: {
            dark: settings.symbol_color || "#000000",
            light: "#FFFFFF"
        },

        errorCorrectionLevel: "H"

    })
    .then(url => {

        setRenderedDataUrl(url);

    })
    .catch(err => {

        console.error(err);

    });

}, [value, settings]);

    if (!renderedDataUrl) return null;

    return (
        <div style={{ display: 'block', margin: '0 auto', textAlign: 'center' }}>
             <img
        src={renderedDataUrl}
        alt="QR"
        style={{
            width: settings.symbol_width_px || 140
        }}
    />
        </div>
    );
}

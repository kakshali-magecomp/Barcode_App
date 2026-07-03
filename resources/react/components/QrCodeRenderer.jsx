import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrCodeRenderer({ value, settings = {} }) {
    const [renderedDataUrl, setRenderedDataUrl] = useState('');

    useEffect(() => {
        if (!value) return;

        const symbolColor = settings.symbol_color || '#000000';
        const widthPx = parseInt(settings.symbol_width_px) || 140;
        
        // READ THE ACTIVE DROPDOWN TOCCLES DIRECTLY FROM YOUR FORM
        const dotType = settings.qr_dot_type || 'square'; 
        const cornerDotStyle = settings.qr_corner_dot_type || 'square'; 
        const cornerSquareStyle = settings.qr_corner_square_type || 'square'; 
        
        // 1. Compile base standard raw matrix coordinates mapping array using core qrcode package
        const qrModules = QRCode.create(String(value), { errorCorrectionLevel: 'H' });
        const matrixSize = qrModules.modules.size;
        const dataMatrix = qrModules.modules.data;

        // Create an offline high-resolution canvas drawing grid workspace
        const canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = widthPx;
        const ctx = canvas.getContext('2d');

        // Paint background area
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, widthPx, widthPx);

        const cellSize = widthPx / matrixSize;

        // 2. Main loop mapping data bits shapes matching your dropdown choices instantly
        for (let r = 0; r < matrixSize; r++) {
            for (let c = 0; c < matrixSize; c++) {
                // Read continuous flat bit string index positions
                const bitActive = dataMatrix[r * matrixSize + c];
                if (!bitActive) continue;

                // Identify if coordinate positions rest inside the 3 tracking finder blocks
                const isTopLeftFinder = r < 7 && c < 7;
                const isTopRightFinder = r < 7 && c >= matrixSize - 7;
                const isBottomLeftFinder = r >= matrixSize - 7 && c < 7;
                const isFinderPattern = isTopLeftFinder || isTopRightFinder || isBottomLeftFinder;

                ctx.fillStyle = symbolColor;

                if (isFinderPattern) {
                    const localR = isTopLeftFinder ? r : (isTopRightFinder ? r : r - (matrixSize - 7));
                    const localC = isTopLeftFinder ? c : (isTopRightFinder ? c - (matrixSize - 7) : c);

                    const isOuterBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6;
                    const isCenterBlock = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;

                    if (isOuterBorder && cornerSquareStyle === 'outline') {
                        // FIXED: Draws clean circular hollow outline rings when "Outline Framework" is chosen
                        ctx.beginPath();
                        ctx.arc((c + 0.5) * cellSize, (r + 0.5) * cellSize, cellSize * 0.45, 0, 2 * Math.PI);
                        ctx.fill();
                    } else if (isCenterBlock && cornerDotStyle === 'dots') {
                        // FIXED: Draws clean circular target points when "Dots / Circles" is chosen
                        ctx.beginPath();
                        ctx.arc((c + 0.5) * cellSize, (r + 0.5) * cellSize, cellSize * 0.45, 0, 2 * Math.PI);
                        ctx.fill();
                    } else {
                        // Standard block geometry path
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize + 0.2, cellSize + 0.2);
                    }
                } else {
                    // Regular data matrices dot formatting logic paths
                    if (dotType === 'rounded') {
                        // FIXED: Draws absolute clean round circles when "Rounded" dot type is chosen
                        ctx.beginPath();
                        ctx.arc((c + 0.5) * cellSize, (r + 0.5) * cellSize, cellSize * 0.42, 0, 2 * Math.PI);
                        ctx.fill();
                    } else {
                        ctx.fillRect(c * cellSize, r * cellSize, cellSize + 0.2, cellSize + 0.2);
                    }
                }
            }
        }

        // 3. Logo handling block
        if (settings.symbol_logo_filename) {
            const logoImage = new Image();
            logoImage.src = `/storage/${settings.symbol_logo_filename}`;
            logoImage.crossOrigin = "anonymous";

            logoImage.onload = () => {
                const logoSize = widthPx * 0.24; 
                const centerOffset = (widthPx - logoSize) / 2;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(centerOffset - 2, centerOffset - 2, logoSize + 4, logoSize + 4);

                ctx.drawImage(logoImage, centerOffset, centerOffset, logoSize, logoSize);
                setRenderedDataUrl(canvas.toDataURL());
            };
            
            logoImage.onerror = () => {
                setRenderedDataUrl(canvas.toDataURL());
            };
        } else {
            setRenderedDataUrl(canvas.toDataURL());
        }

    }, [value, settings]);

    if (!renderedDataUrl) return null;

    return (
        <div style={{ display: 'block', margin: '0 auto', textAlign: 'center' }}>
            <img 
                src={renderedDataUrl} 
                alt="Custom Scannable QR Matrix" 
                style={{ 
                    width: `${settings.symbol_width_px || 140}px`, 
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                    borderRadius: '4px'
                }} 
            />
        </div>
    );
}

// Print state management
let isPrinting = false;

export function buildPrintCss(paperTemplate, opts = {}) {
    // Validate paper template
    if (!paperTemplate || !paperTemplate.label) {
        console.error('Invalid paper template for CSS generation');
        return {
            hasRealPaper: false,
            css: getFallbackCss(),
        };
    }

    // Get dimensions with proper defaults
    const labelWidth = Number(paperTemplate.label.width) || 50;
    const labelHeight = Number(paperTemplate.label.height) || 30;
    const rows = Number(paperTemplate.rows || 1);
    const columns = Number(paperTemplate.columns || 1);
    const gapX = Number(paperTemplate.gapX || 0);
    const gapY = Number(paperTemplate.gapY || 0);
    const marginTop = Number(paperTemplate.marginTop || 0);
    const marginLeft = Number(paperTemplate.marginLeft || 0);

    // Calculate paper size
    const paperWidth = Number(paperTemplate.paper?.width) || 
                       (labelWidth * columns + gapX * (columns - 1) + marginLeft);
    const paperHeight = Number(paperTemplate.paper?.height) || 
                        (labelHeight * rows + gapY * (rows - 1) + marginTop);

    // Font sizing
    const fontFactor = opts.fontFactor ?? 0.14;
    const fontMin = opts.fontMin ?? 3.5;
    const fontMax = opts.fontMax ?? 7;
    const textPt = Math.max(fontMin, Math.min(fontMax, Math.round(labelHeight * fontFactor)));

    // Padding
    const horizontalPadding = Math.max(0.8, Math.min(3, labelWidth * 0.04));
    const verticalPadding = Math.max(0.4, Math.min(1.5, labelHeight * 0.04));

    // Barcode height
    const barcodeHeightMm = Math.max(4, Math.min(labelHeight * 0.55, labelHeight - verticalPadding * 2));

    const isRoll = paperTemplate.type === 'roll' || (rows === 1 && columns === 1);

    const css = `
        @page {
            size: ${paperWidth}mm ${paperHeight}mm;
            margin: 0 !important;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${paperWidth}mm !important;
            background: white;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
        }

        .print-sheet {
            position: relative;
            width: ${paperWidth}mm;
            height: ${paperHeight}mm;
            margin: 0 !important;
            padding: ${marginTop}mm 0 0 ${marginLeft}mm !important;
            
            display: grid;
            grid-template-columns: repeat(${columns}, ${labelWidth}mm);
            grid-template-rows: repeat(${rows}, ${labelHeight}mm);
            column-gap: ${gapX}mm;
            row-gap: ${gapY}mm;
            align-content: start;
            justify-content: start;
            
            page-break-after: always;
            break-after: page;
            overflow: hidden;
        }

        .print-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
        }

        .label {
            width: ${labelWidth}mm !important;
            height: ${labelHeight}mm !important;
            min-width: ${labelWidth}mm !important;
            max-width: ${labelWidth}mm !important;
            min-height: ${labelHeight}mm !important;
            max-height: ${labelHeight}mm !important;
            
            padding: ${verticalPadding}mm ${horizontalPadding}mm !important;
            margin: 0 !important;
            
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            
            text-align: center;
            overflow: visible !important;
            
            page-break-inside: avoid;
            break-inside: avoid;
            box-sizing: border-box;
        }

        .label-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .label * {
            box-sizing: border-box;
            max-width: 100% !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: ${textPt}pt !important;
            line-height: 1.2 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        .label > div, .label > span {
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            word-wrap: break-word !important;
            margin-bottom: 0.5mm !important;
        }

        .print-sku {
            font-weight: 600 !important;
            font-size: ${textPt}pt !important;
            padding-top: 1.5mm !important;
            margin-bottom: 0.5mm !important;
        }

        .label .barcode,
        .label .qr,
        .label svg,
        .label img {
            display: block !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: ${barcodeHeightMm}mm !important;
            margin: 0.5mm auto !important;
            flex-shrink: 0 !important;
        }

        .label svg.barcode {
            overflow: visible !important;
        }

        .label .barcode text {
            font-size: ${Math.max(3.5, Math.min(5, textPt * 0.7))}pt !important;
        }

        ${isRoll ? `
            .print-sheet {
                display: block !important;
                width: ${paperWidth}mm !important;
                height: ${paperHeight}mm !important;
                padding: 0 !important;
            }
            .print-sheet .label {
                margin: 0 auto !important;
            }
        ` : ''}

        @media print {
            html, body {
                width: ${paperWidth}mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }
            
            .print-sheet {
                width: ${paperWidth}mm !important;
                height: ${paperHeight}mm !important;
                margin: 0 !important;
                padding: ${marginTop}mm 0 0 ${marginLeft}mm !important;
                page-break-after: always !important;
                break-after: page !important;
                overflow: hidden !important;
            }
            
            .print-sheet:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
            }
            
            .label {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
        }
    `;

    return {
        hasRealPaper: true,
        css,
        labelsPerSheet: rows * columns,
        paperWidth,
        paperHeight,
    };
}

function getFallbackCss() {
    return `
        @page {
            margin: 5mm;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; }
        .print-sheet {
            width: 250px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(1, 250px);
            gap: 10px;
        }
        .label {
            width: 250px;
            min-height: 140px;
            padding: 10px;
            text-align: center;
            overflow: hidden;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .label * {
            max-width: 100% !important;
            line-height: 1.2 !important;
        }
        .barcode, .qr, .label svg {
            display: block;
            max-width: 100% !important;
            height: auto !important;
            margin: 2px auto !important;
        }
        @media print {
            .print-sheet {
                page-break-after: always;
                break-after: page;
            }
        }
    `;
}

export function jsBarcodeInitScript() {
    return `
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
    let printTriggered = false;
    
    window.onload = function () {
        console.log('Initializing barcodes for print...');
        
        document.querySelectorAll(".barcode").forEach(function (el, index) {
            const format = (el.dataset.format || "CODE128").toUpperCase();
            let value = String(el.dataset.value || "").trim();
            const fontSize = Number(el.dataset.font) || 16;
            const width = Number(el.dataset.width) || 2;
            const height = Number(el.dataset.height) || 45;
            const color = el.dataset.color || "#000000";
            const displayValue = el.dataset.display !== "false";

            console.log(\`Barcode \${index}: format=\${format}, value=\${value}\`);

            if (!value) {
                el.outerHTML = '<div style="color:#999;font-size:' + fontSize + 'px;text-align:center;">No data</div>';
                return;
            }

            // UPC validation
            if (format === "UPC" || format === "UPCA") {
                value = value.replace(/\\D/g, "");
                if (value.length === 11) {
                    let sum = 0;
                    for (let i = 0; i < 11; i++) {
                        sum += parseInt(value[i]) * (i % 2 === 0 ? 3 : 1);
                    }
                    value += ((10 - (sum % 10)) % 10);
                }
            }

            try {
                JsBarcode(el, value, {
                    format: format,
                    width: width,
                    height: height,
                    fontSize: fontSize,
                    displayValue: displayValue,
                    lineColor: color,
                    background: "#ffffff",
                    margin: 2,
                    textMargin: 2,
                });
            } catch (e) {
                console.error('Barcode generation error:', e);
                el.outerHTML = '<div style="color:#d82c0d;font-size:' + fontSize + 'px;font-weight:bold;padding:4px;text-align:center;">Invalid barcode</div>';
            }
        });
        
        // Trigger print only once
        if (!printTriggered) {
            printTriggered = true;
            setTimeout(function () { 
                window.focus(); 
                window.print(); 
            }, 600);
        }
    };
</script>
`;
}

export function openPrintWindow({
    bodyHtml,
    paperTemplate,
    useJsBarcodeScript = true,
    onAfterPrint,
    fontOptions = {},
}) {
    // Prevent multiple print windows
    if (isPrinting) {
        console.log('Print already in progress');
        return false;
    }

    // Validate inputs
    if (!paperTemplate) {
        console.error('Paper template is required');
        alert('Paper template is missing. Please select a paper brand and model.');
        return false;
    }

    if (!bodyHtml) {
        console.error('Body HTML is required');
        alert('No content to print.');
        return false;
    }

    // Build CSS
    const { css } = buildPrintCss(paperTemplate, fontOptions);

    // Open print window
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    
    if (!printWindow) {
        alert('Please allow popups for this website to print labels.');
        return false;
    }

    // Set printing flag
    isPrinting = true;

    // Write content to print window
    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Print Labels</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                ${css}
                .print-document {
                    margin: 0;
                    padding: 0;
                    background: white;
                }
            </style>
        </head>
        <body class="print-document">
            ${bodyHtml}
            ${useJsBarcodeScript ? jsBarcodeInitScript() : ''}
        </body>
        </html>
    `);
    printWindow.document.close();

    // Handle print completion and cleanup
    let isPrintDialogClosed = false;

    const cleanup = () => {
        if (!isPrintDialogClosed) {
            isPrintDialogClosed = true;
            isPrinting = false;
            if (onAfterPrint && typeof onAfterPrint === 'function') {
                onAfterPrint();
            }
            setTimeout(() => {
                try {
                    printWindow.close();
                } catch (e) {
                    // Window already closed
                }
            }, 1000);
        }
    };

    // Listen for print completion
    printWindow.addEventListener('afterprint', cleanup);

    // Handle window close
    printWindow.addEventListener('beforeunload', function() {
        isPrinting = false;
    });

    // Fallback cleanup after timeout
    setTimeout(() => {
        if (!isPrintDialogClosed) {
            cleanup();
        }
    }, 30000);

    return true;
}
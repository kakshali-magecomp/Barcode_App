// Print state management
let isPrinting = false;

export function buildPrintCss(paperTemplate, opts = {}) {
    if (!paperTemplate || !paperTemplate.label) {
        console.error("Invalid paper template for CSS generation");

        return {
            hasRealPaper: false,
            css: getFallbackCss(),
        };
    }

    const labelWidth = Number(paperTemplate.label.width) || 50;
    const labelHeight = Number(paperTemplate.label.height) || 30;

    const rows = Math.max(1, Number(paperTemplate.rows) || 1);
    const columns = Math.max(1, Number(paperTemplate.columns) || 1);

    const gapX = Number(paperTemplate.gapX) || 0;
    const gapY = Number(paperTemplate.gapY) || 0;

    const marginTop = Number(paperTemplate.marginTop) || 0;
    const marginLeft = Number(paperTemplate.marginLeft) || 0;

    const calculatedPaperWidth =
        marginLeft +
        (columns * labelWidth) +
        ((columns - 1) * gapX);

    const calculatedPaperHeight =
        marginTop +
        (rows * labelHeight) +
        ((rows - 1) * gapY);

    const paperWidth =
        Number(paperTemplate.paper?.width) > 0
            ? Number(paperTemplate.paper.width)
            : calculatedPaperWidth;

    const paperHeight =
        Number(paperTemplate.paper?.height) > 0
            ? Number(paperTemplate.paper.height)
            : calculatedPaperHeight;

    const isSmallLabel = labelHeight <= 16 || labelWidth <= 50;

    const fontFactor = opts.fontFactor ?? (isSmallLabel ? 0.11 : 0.14);
    const fontMin = opts.fontMin ?? (isSmallLabel ? 3.0 : 3.5);
    const fontMax = opts.fontMax ?? (isSmallLabel ? 5.5 : 7);

    const textPt = Math.max(
        fontMin,
        Math.min(
            fontMax,
            labelHeight * fontFactor
        )
    );

    const horizontalPadding = Math.min(
        1.5,
        Math.max(0.2, labelWidth * 0.015)
    );

    const verticalPadding = Math.min(
        1,
        Math.max(0.15, labelHeight * 0.015)
    );

    const barcodeHeightMm = Math.max(
        2.5,
        Math.min(
            isSmallLabel ? labelHeight * 0.32 : labelHeight * 0.45,
            isSmallLabel ? Math.max(2.5, labelHeight - 7.5) : labelHeight - (verticalPadding * 2)
        )
    );

    const isRoll = paperTemplate.type === "roll";
    const css = `
        @page {
            size: ${paperWidth}mm ${paperHeight}mm;
            margin: 0 !important;
        }

        *,
        *::before,
        *::after {
            box-sizing: border-box !important;
        }

        html,
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${paperWidth}mm !important;
            min-width: ${paperWidth}mm !important;
            max-width: ${paperWidth}mm !important;
            background: #ffffff !important;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
        }

       .print-sheet {
    position: relative !important;

    width: ${paperWidth}mm !important;
    height: ${paperHeight}mm !important;

    margin: 0 !important;

    padding:
        ${marginTop}mm
        0
        0
        ${marginLeft}mm !important;

    display: grid !important;

    grid-template-columns:
        repeat(${columns}, minmax(0, ${labelWidth}mm)) !important;

    grid-template-rows:
        repeat(${rows}, minmax(0, ${labelHeight}mm)) !important;

    column-gap: ${gapX}mm !important;
    row-gap: ${gapY}mm !important;

    align-items: start !important;
    align-content: start !important;
    justify-content: start !important;

    overflow: hidden !important;

    page-break-after: always !important;
    break-after: page !important;

    page-break-inside: avoid !important;
    break-inside: avoid !important;
}

        .print-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
        }

        .label-grid {
            display: grid !important;
            grid-template-columns: repeat(${columns}, minmax(0, ${labelWidth}mm)) !important;
            grid-template-rows: repeat(${rows}, minmax(0, ${labelHeight}mm)) !important;
            column-gap: ${gapX}mm !important;
            row-gap: ${gapY}mm !important;
            align-items: start !important;
            align-content: start !important;
            justify-content: start !important;
            width: 100% !important;
            height: 100% !important;
        }

        .label {
    width: ${labelWidth}mm !important;
    min-width: 0 !important;
    max-width: ${labelWidth}mm !important;

    height: ${labelHeight}mm !important;
    min-height: 0 !important;
    max-height: ${labelHeight}mm !important;

    margin: 0 !important;

    padding:
        ${verticalPadding}mm
        ${horizontalPadding}mm !important;

    display: flex !important;
    flex-direction: column !important;

    align-items: center !important;
    justify-content: center !important;

    text-align: center !important;

    overflow: hidden !important;

    font-family: Arial, Helvetica, sans-serif !important;

    font-size: ${textPt}pt !important;
    line-height: 1.02 !important;

    page-break-inside: avoid !important;
    break-inside: avoid !important;

    box-sizing: border-box !important;

    flex-shrink: 0 !important;
    word-break: break-all !important;
    overflow-wrap: anywhere !important;
}

        .label-content,
        .template-label-content {
            width: 100% !important;
            max-width: 100% !important;

            height: 100% !important;
            max-height: 100% !important;

            margin: 0 !important;
            padding: 0 !important;

            display: flex !important;
            flex-direction: column !important;

            align-items: center !important;
            justify-content: center !important;

            overflow: hidden !important;
        }

        .label *,
        .label-content *,
        .template-label-content * {
            box-sizing: border-box !important;
            max-width: 100% !important;
            font-family: Arial, Helvetica, sans-serif !important;
            line-height: 1.05 !important;
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            font-size: ${textPt}pt;
        }

        .label .template-label-content,
        .label .label-content {
            font-size: ${textPt}pt !important;
        }

        .print-sku {
            font-weight: 700 !important;
            font-size: ${textPt}pt !important;

            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            white-space: normal !important;
            max-width: 100% !important;
            text-align: center !important;

            padding: 0 !important;
            margin: 0 0 ${isSmallLabel ? '1mm' : '1.8mm'} 0 !important;

            line-height: 1.15 !important;
        }

        .print-line2 {
            display: flex !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 0.6mm !important;
            margin: 0 0 0.3mm 0 !important;
            padding: 0 !important;
            line-height: 1.1 !important;
            max-width: 100% !important;
        }

        .print-title {
            font-weight: 700 !important;
            font-size: ${textPt}pt !important;
            color: #111111 !important;
        }

        .print-variant {
            font-size: ${Math.max(3.5, textPt * 0.85).toFixed(2)}pt !important;
            color: #555555 !important;
        }

        .print-price {
            font-weight: 700 !important;
            font-size: ${textPt}pt !important;
            color: #111111 !important;
        }

        .print-vendor {
            font-weight: 500 !important;
            font-size: ${Math.max(3.5, textPt * 0.85).toFixed(2)}pt !important;
            color: #555555 !important;
            margin: 0 0 0.3mm 0 !important;
            padding: 0 !important;
            line-height: 1.1 !important;
        }

        .label .barcode,
        .label .qr,
        .label svg,
        .label img {
            display: block !important;

            width: auto !important;
            max-width: 100% !important;

            height: auto !important;
            max-height: ${barcodeHeightMm}mm !important;

            margin: 0.3mm auto !important;

            flex-shrink: 1 !important;
        }

        .label svg.barcode {
            overflow: visible !important;
        }

        .label .barcode text {
            font-size: ${Math.max(
        3,
        Math.min(5, textPt * 0.75)
    )}pt !important;
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
        ` : ""}

        @media print {
            @page {
                size: ${paperWidth}mm ${paperHeight}mm !important;
                margin: 0 !important;
            }

            html,
            body {
                margin: 0 !important;
                padding: 0 !important;

                width: ${paperWidth}mm !important;
                min-width: ${paperWidth}mm !important;
                max-width: ${paperWidth}mm !important;

                height: ${paperHeight}mm !important;
                min-height: ${paperHeight}mm !important;
                background: #ffffff !important;

                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-sheet {
                width: ${paperWidth}mm !important;
                height: ${paperHeight}mm !important;

                margin: 0 !important;

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

export function openPrintWindow(options = {}) {
    const {
        bodyHtml,
        sheetsHtml,
        paperTemplate,
        paperSettings,
        useJsBarcodeScript = true,
        onAfterPrint,
        fontOptions = {},
    } = options;

    const finalPaper = paperTemplate || paperSettings;
    const finalHtml = bodyHtml || sheetsHtml;

    // Prevent multiple print windows
    if (isPrinting) {
        console.log('Print already in progress');
        return false;
    }

    // Validate inputs
    if (!finalPaper) {
        console.error('Paper template is required');
        alert('Paper template is missing. Please select a paper brand and model.');
        return false;
    }

    if (!finalHtml) {
        console.error('Body HTML is required');
        alert('No content to print.');
        return false;
    }

    // Build CSS
    const { css } = buildPrintCss(finalPaper, fontOptions);

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
            ${finalHtml}
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
    printWindow.addEventListener('beforeunload', function () {
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
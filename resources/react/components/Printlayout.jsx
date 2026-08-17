export function buildPrintCss(paperTemplate, opts = {}) {
    const paper = paperTemplate;

    const labelWidth = Number(paper?.label?.width) || null;
    const labelHeight = Number(paper?.label?.height) || null;

    const rows = Number(paper?.rows || 1);
    const columns = Number(paper?.columns || 1);

    const gapX = Number(paper?.gapX || 0);
    const gapY = Number(paper?.gapY || 0);

    const marginTop = Number(paper?.marginTop || 0);
    const marginLeft = Number(paper?.marginLeft || 0);

    const hasRealPaper = paper && labelWidth && labelHeight;

    if (!hasRealPaper) {
        return {
            hasRealPaper: false,
            css: `
                @page {
                    margin: 5mm;
                }

                * {
                    box-sizing: border-box;
                }

                html,
                body {
                    margin: 0;
                    padding: 0;
                }

                body {
                    font-family: Arial, sans-serif;
                }

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

                .label > div,
                .label span {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: normal;
                }

                .barcode,
                .qr,
                .label svg,
                .label img {
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

                    .print-sheet:last-child {
                        page-break-after: auto;
                        break-after: auto;
                    }
                }
            `,
        };
    }

   

    const paperWidth =
        Number(paper?.paper?.width) ||
        labelWidth * columns +
            gapX * (columns - 1) +
            marginLeft;

    const paperHeight =
        Number(paper?.paper?.height) ||
        labelHeight * rows +
            gapY * (rows - 1) +
            marginTop;

  
    const fontFactor = opts.fontFactor ?? 0.14;
    const fontMin = opts.fontMin ?? 4;
    const fontMax = opts.fontMax ?? 7;

    const textPt = Math.max(
        fontMin,
        Math.min(
            fontMax,
            Math.round(labelHeight * fontFactor)
        )
    );

  
    const horizontalPadding = Math.max(
        0.8,
        Math.min(2.5, labelWidth * 0.04)
    );

    const verticalPadding = Math.max(
        0.4,
        Math.min(1.5, labelHeight * 0.04)
    );

    
    const barcodeHeightMm = Math.max(
        4,
        Math.min(
            labelHeight * 0.55,
            labelHeight - verticalPadding * 2
        )
    );

   
    const labelsPerSheet = rows * columns;
    const isRoll =
        paper?.type === "roll" ||
        (rows === 1 && columns === 1);

    const css = `
        @page {
            size: ${paperWidth}mm ${paperHeight}mm;
            margin: 0 !important;
        }

        * {
            box-sizing: border-box;
        }

        html,
        body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${paperWidth}mm !important;
        }

        body {
            font-family: Arial, sans-serif;
            background: white;
        }

        

        .print-sheet {
            position: relative;

            width: ${paperWidth}mm;
            height: ${paperHeight}mm;

            margin: 0 !important;
            padding: ${marginTop}mm 0 0 ${marginLeft}mm !important;

            display: grid;

            grid-template-columns:
                repeat(${columns}, ${labelWidth}mm);

            grid-template-rows:
                repeat(${rows}, ${labelHeight}mm);

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

            padding:
                ${verticalPadding}mm
                ${horizontalPadding}mm !important;

            margin: 0 !important;

            overflow: hidden !important;

            display: flex !important;

            flex-direction: column;
            align-items: center;
            justify-content: center;

            text-align: center;

            page-break-inside: avoid;
            break-inside: avoid;

            box-sizing: border-box;
        }

      

        .label * {
            box-sizing: border-box;

            max-width: 100% !important;

            font-size: ${textPt}pt !important;

            line-height: 1.05 !important;

            margin: 0 !important;
            padding: 0 !important;
        }

        .label > div,
        .label > span,
        .label-content > div,
        .label-content > span {
            width: 100% !important;

            max-width: 100% !important;

            overflow: hidden !important;

            text-overflow: ellipsis !important;

            white-space: nowrap !important;

            margin-bottom: 0.5mm !important;
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

            margin: 0.5mm auto !important;

            flex-shrink: 0 !important;

            object-fit: contain !important;
        }

       

        .label svg.barcode,
        .label svg[aria-label*="barcode"],
        .label svg[id*="barcode"] {
            overflow: visible !important;
        }

        

        .label .barcode text {
            font-size: ${Math.max(
                3.5,
                Math.min(5, textPt * 0.7)
            )}pt !important;

            white-space: normal !important;

            overflow: visible !important;
        }


        .label strong,
        .label b {
            font-weight: 700 !important;
        }

       

        ${
            isRoll
                ? `
            .print-sheet {
                display: block !important;

                width: ${paperWidth}mm !important;
                height: ${paperHeight}mm !important;

                padding: 0 !important;

                page-break-after: always;
                break-after: page;
            }

            .print-sheet .label {
                width: ${labelWidth}mm !important;
                height: ${labelHeight}mm !important;
            }
            `
                : ""
        }

        

        @media print {
            html,
            body {
                width: ${paperWidth}mm !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            .print-sheet {
                width: ${paperWidth}mm !important;
                height: ${paperHeight}mm !important;

                margin: 0 !important;
                overflow: hidden !important;
            }
        }
    `;

    return {
        hasRealPaper: true,
        css,
        labelsPerSheet,
    };
}

export function jsBarcodeInitScript() {
    return `
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
window.onload = function () {
    document.querySelectorAll(".barcode").forEach(function (el) {
        const format = (el.dataset.format || "CODE128").toUpperCase();
        let value = String(el.dataset.value || "").trim();
        const fontSize = Number(el.dataset.font) || 16;

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
                width: Number(el.dataset.width) || 2,
                height: Number(el.dataset.height) || 45,
                fontSize: fontSize,
                displayValue: el.dataset.display !== "false",
                lineColor: el.dataset.color || "#000000",
                background: "#ffffff",
                margin: 2,
            });
        } catch (e) {
            el.outerHTML =
                '<div style="color:#d82c0d;font-size:' + fontSize + 'px;font-weight:bold;padding:4px;border:1px dashed #d82c0d;text-align:center;">Incorrect value for ' + format + ' barcode format</div>';
        }
    });
    setTimeout(function () { window.focus(); window.print(); }, 500);
};
</script>
`;
}

export function openPrintWindow({
    bodyHtml,
    paperTemplate,
    useJsBarcodeScript = false,
    onAfterPrint,
    fontOptions = {},
}) {
    const { css } = buildPrintCss(
        paperTemplate,
        fontOptions
    );

    const printWindow = window.open(
        "",
        "_blank",
        "width=1000,height=800"
    );

    if (!printWindow) {
        return false;
    }

    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">

            <title>Print Labels</title>

            <style>
                ${css}
            </style>
        </head>

        <body class="print-document">

            ${bodyHtml}

            ${
                useJsBarcodeScript
                    ? jsBarcodeInitScript()
                    : ""
            }

        </body>
        </html>
    `);

    printWindow.document.close();

    
    setTimeout(() => {
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();

            if (onAfterPrint) {
                onAfterPrint();
            }

            setTimeout(() => {
                printWindow.close();
            }, 500);

        }, 300);

    }, 700);

    return true;
}
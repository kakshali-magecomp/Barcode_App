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
@page { margin: 5mm; }
* { box-sizing: border-box; }
body { margin:10px; padding:0; font-family:Arial,sans-serif; display:grid; grid-template-columns:repeat(auto-fill,250px); gap:10px; align-items:start; }
.label { width:250px; min-height:140px; border:1px solid #ddd; padding:10px; box-sizing:border-box; text-align:center; page-break-inside:avoid; break-inside:avoid; overflow:hidden; }
.label * { font-size: 12pt !important; line-height: 1.3 !important; }
.label > div, .label span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin: 0 0 4px !important; }
.label span + span { margin-left: 4px !important; }
.barcode, .qr, .label svg, .label img { display:block; max-width:100%; height:auto; margin:0 auto; }
@media print { body { margin: 5mm; } .label { page-break-inside: avoid; break-inside: avoid; } }
`,
        };
    }

    const paperWidth =
        Number(paper?.paper?.width) || labelWidth * columns + gapX * (columns - 1) + marginLeft;
    const paperHeight =
        Number(paper?.paper?.height) || labelHeight * rows + gapY * (rows - 1) + marginTop;

    const fontFactor = opts.fontFactor ?? 0.28;
    const fontMin = opts.fontMin ?? 5;
    const fontMax = opts.fontMax ?? 11;
    const textPt = Math.max(fontMin, Math.min(fontMax, Math.round(labelHeight * fontFactor)));
    const barcodeHeightMm = Math.max(4, labelHeight * 0.4);

    const isRoll = rows === 1 && columns === 1;

    const css = `
@page { size: ${paperWidth}mm ${paperHeight}mm; margin: 0; }
* { box-sizing: border-box; }
html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: ${paperWidth}mm;
    ${isRoll ? "" : `min-height: ${paperHeight}mm;`}
}
body {
    font-family: Arial, sans-serif;
    display: grid;
    grid-template-columns: repeat(${columns}, ${labelWidth}mm);
    grid-auto-rows: ${labelHeight}mm;
    column-gap: ${gapX}mm;
    row-gap: ${gapY}mm;
    padding-top: ${marginTop}mm !important;
    padding-left: ${marginLeft}mm !important;
    align-content: start;
    justify-content: start;
    align-items: start;
    justify-items: start;
}
${isRoll ? `
body { display: block !important; }
.label { page-break-after: always; break-after: page; }
.label:last-child { page-break-after: auto; }
` : ""}
.label {
    width: ${labelWidth}mm;
    height: ${labelHeight}mm;
    align-self: start;
    justify-self: start;
    padding: ${Math.max(0.5, labelHeight * 0.05)}mm;
    box-sizing: border-box;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
.label * {
    max-width: 100% !important;
    font-size: ${textPt}pt !important;
    line-height: 1.2 !important;
    margin: 0 !important;
    padding: 0 !important;
}
.label > div,
.label span {
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0 0 0.6mm !important;
}
.label span + span {
    margin-left: 4px !important;
}
.label strong, .label b {
    font-weight: 700 !important;
}
.label svg, .label img, .barcode, .qr {
    display: block;
    max-width: 90%;
    max-height: ${barcodeHeightMm}mm !important;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
    margin: ${Math.max(0.3, labelHeight * 0.03)}mm auto !important;
    flex-shrink: 0;
}
`;

    return { hasRealPaper: true, css };
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
    const { css } = buildPrintCss(paperTemplate, fontOptions);
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
        return false;
    }

    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Print Labels</title>
<style>${css}</style>
</head>
<body>
${bodyHtml}
${useJsBarcodeScript ? jsBarcodeInitScript() : ""}
</body>
</html>
`);
    printWindow.document.close();

    if (!useJsBarcodeScript) {
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            if (onAfterPrint) onAfterPrint();
            printWindow.close();
        }, 500);
    } else if (onAfterPrint) {
        setTimeout(onAfterPrint, 900);
    }

    return true;
}
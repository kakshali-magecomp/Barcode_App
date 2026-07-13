export function generateBarcode(item, barcodeSettings) {

    if (!barcodeSettings) {
        return item.barcode || "";
    }

    const pattern = barcodeSettings.barcode_pattern;

    if (!pattern) {
        return "";
    }

    const match = pattern.match(/\[([AN])\.(\d+)\]/);

    if (!match) {
        return "";
    }

    const type = match[1];
    const length = parseInt(match[2], 10);

    const numbers = "0123456789";
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let barcode = "";

    do {

        barcode = "";

        for (let i = 0; i < length; i++) {

            barcode +=
                type === "N"
                    ? numbers[Math.floor(Math.random() * numbers.length)]
                    : letters[Math.floor(Math.random() * letters.length)];

        }

    } while (

        barcodeSettings.prevent_zero_start_end &&

        (
            barcode.startsWith("0") ||
            barcode.endsWith("0")
        )

    );

    return barcode;

}
export function detectBarcodeFormat(barcode, barcodeSettings) {

    if (!barcodeSettings?.auto_detect_gtin_format) {
        return barcodeSettings?.barcode_format || "CODE128";
    }

    switch (barcode.length) {

        case 8:
            return "EAN8";

        case 12:
            return "UPCA";

        case 13:
            return "EAN13";

        case 14:
            return "ITF14";

        default:
            return barcodeSettings?.barcode_format || "CODE128";
    }
}
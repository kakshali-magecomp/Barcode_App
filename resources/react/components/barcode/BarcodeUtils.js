export function generateBarcode(item, barcodeSettings) {

    const pattern = barcodeSettings?.barcode_pattern;

    if (!pattern) {
        return "";
    }

    return pattern.replace(
        /\[(PRODUCT(?:\.\d+)?|SKU|VENDOR|HANDLE|A\.\d+|N\.\d+)\]/g,

        (match, token) => {

            // PRODUCT
            if (token.startsWith("PRODUCT")) {

                let product =
                    item?.product_title ||
                    item?.title ||
                    "";

                product = product
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase();

                if (token.includes(".")) {

                    const length = parseInt(token.split(".")[1]);

                    return product.substring(0, length);

                }

                return product;
            }

            // SKU
            if (token === "SKU") {

                return (item?.current_sku || item?.sku || "")
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase();

            }

            // Vendor
            if (token === "VENDOR") {

                return (item?.vendor || "")
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase();

            }

            // Handle
            if (token === "HANDLE") {

                return (item?.handle || "")
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase();

            }

            // Random Letters
            if (token.startsWith("A.")) {

                const length = parseInt(token.split(".")[1]);

                const letters =
                    "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

                let value = "";

                for (let i = 0; i < length; i++) {

                    value +=
                        letters[
                        Math.floor(
                            Math.random() *
                            letters.length
                        )
                        ];

                }

                return value;

            }

            // Random Numbers
            if (token.startsWith("N.")) {

                const length = parseInt(token.split(".")[1]);

                const numbers = "0123456789";

                let value = "";

                for (let i = 0; i < length; i++) {

                    value +=
                        numbers[
                        Math.floor(
                            Math.random() *
                            numbers.length
                        )
                        ];

                }

                return value;

            }

            return "";
        }
    );

}

// Detect Barcode Format
export function detectBarcodeFormat(barcode, barcodeSettings = {}) {
    const format = (
        barcodeSettings.barcode_format ||
        "CODE128"
    ).toUpperCase();

    const value = String(barcode || "").trim();
    const isNumeric = /^\d+$/.test(value);

    // Auto detect only when CODE128 is selected
    const shouldAutoDetect =
    barcodeSettings.auto_detect_gtin_format &&
    !barcodeSettings.barcode_format;

if (shouldAutoDetect && isNumeric) {
    switch (value.length) {
        case 8:
            return "EAN8";

        case 11:
        case 12:
            return "UPCA";

        case 13:
            return "EAN13";

        case 14:
            return "ITF14";

        default:
            return "CODE128";
    }
}

    switch (format) {
        case "CODE39":
        case "CODE 39":
            return "CODE39";

        case "UPCA":
        case "UPC":
            return "UPCA";

        case "EAN8":
            return "EAN8";

        case "EAN13":
            return "EAN13";

        case "ITF14":
            return "ITF14";

        default:
            return "CODE128";
    }
}

// Generic Mod10 Checksum
// Used for EAN13 / UPCA / ITF14
function calculateModulo10(digits) {
    let sum = 0;

    for (let i = digits.length - 1, weight = 3; i >= 0; i--) {
        sum += Number(digits[i]) * weight;
        weight = weight === 3 ? 1 : 3;
    }

    return (10 - (sum % 10)) % 10;
}

// EAN8 Checksum
function calculateEAN8Checksum(digits) {
    if (digits.length !== 7) {
        throw new Error("EAN8 requires exactly 7 digits.");
    }

    let sum = 0;

    for (let i = 0; i < 7; i++) {
        const digit = Number(digits[i]);

        if ((i + 1) % 2 === 1) {
            sum += digit * 3;
        } else {
            sum += digit;
        }
    }

    return (10 - (sum % 10)) % 10;
}

// EAN8
function generateEAN8(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(7, "0").slice(-7);

    return digits + calculateEAN8Checksum(digits);
}

// EAN13
function generateEAN13(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(12, "0").slice(-12);

    return digits + calculateModulo10(digits);
}

// UPCA
// ===============================
function generateUPCA(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(11, "0").slice(-11);

    return digits + calculateModulo10(digits);
}

// ITF14
function generateITF14(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(13, "0").slice(-13);

    return digits + calculateModulo10(digits);
}

// Final Barcode Value
export function getBarcodeValue(value, barcodeSettings = {}) {
    if (!value) return "";

    const format = (
        barcodeSettings.barcode_format || "CODE128"
    ).toUpperCase();

    switch (format) {
        case "CODE128":
            return String(value)
                .trim()
                .replace(/[\r\n\t]/g, "");

        case "CODE39":
            return String(value)
                .toUpperCase()
                .replace(/[^0-9A-Z \-.$/+%]/g, "");

        case "EAN8":
            return generateEAN8(value);

        case "EAN13":
            return generateEAN13(value);

        case "UPCA":
            return generateUPCA(value);

        case "ITF14":
            return generateITF14(value);

        default:
            return String(value);
    }
}
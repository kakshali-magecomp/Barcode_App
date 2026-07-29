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
export function detectBarcodeFormat(barcode, barcodeSettings = {}) {

    // Default
    let format = barcodeSettings.barcode_format || "CODE128";

    // Convert to string
    const value = String(barcode || "").trim();

    // Only auto-detect when the ENTIRE value is numeric
    const isNumeric = /^\d+$/.test(value);

    if (barcodeSettings.auto_detect_gtin_format && format === "CODE128") {

        switch (value.length) {

            case 8:
                return "EAN8";

            case 11:
            case 12:
                return "UPC";

            case 13:
                return "EAN13";

            case 14:
                return "ITF14";

            default:
                break;
        }
    }

    // Manual selection
    switch (format) {

        case "Code39":
        case "CODE39":
            return "CODE39";

        case "UPCA":
        case "UPC":
            return "UPC";

        case "EAN8":
            return "EAN8";

        case "EAN13":
            return "EAN13";

        case "ITF14":
            return "ITF14";

        case "CODE128":
        default:
            return "CODE128";
    }
}
function calculateEAN8(data) {

    data = data.replace(/\D/g, "").padStart(7, "0").slice(-7);

    let sum = 0;

    for (let i = data.length - 1, pos = 1; i >= 0; i--, pos++) {
        sum += Number(data[i]) * (pos % 2 === 1 ? 3 : 1);
    }

    const checkDigit = (10 - (sum % 10)) % 10;

    return data + checkDigit;
}

function calculateEAN13(data) {

    data = data.replace(/\D/g, "").padStart(12, "0").slice(0, 12);

    let sum = 0;

    for (let i = 0; i < 12; i++) {
        sum += Number(data[i]) * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;

    return data + checkDigit;
}

function calculateUPCA(data) {

    data = data.replace(/\D/g, "").padStart(11, "0").slice(0, 11);

    let sum = 0;

    for (let i = 0; i < 11; i++) {
        sum += Number(data[i]) * (i % 2 === 0 ? 3 : 1);
    }

    const checkDigit = (10 - (sum % 10)) % 10;

    return data + checkDigit;
}

function calculateITF14(data) {

    data = data.replace(/\D/g, "").padStart(13, "0").slice(0, 13);

    let sum = 0;

    for (let i = 0; i < 13; i++) {
        sum += Number(data[i]) * (i % 2 === 0 ? 3 : 1);
    }

    const checkDigit = (10 - (sum % 10)) % 10;

    return data + checkDigit;
}

function calculateEANChecksum(number) {
    let sum = 0;

    for (let i = 0; i < number.length; i++) {
        const digit = Number(number[i]);

        if ((number.length - i) % 2 === 0) {
            sum += digit * 3;
        } else {
            sum += digit;
        }
    }

    return (10 - (sum % 10)) % 10;
}
function calculateEAN8Checksum(digits) {

    if (digits.length !== 7) {
        throw new Error("EAN8 requires exactly 7 digits.");
    }

    let sum = 0;

    for (let i = 0; i < 7; i++) {

        const digit = parseInt(digits[i], 10);

        // EAN-8 weights:
        // positions 1,3,5,7 => ×3
        // positions 2,4,6   => ×1
        if ((i + 1) % 2 === 1) {
            sum += digit * 3;
        } else {
            sum += digit;
        }
    }

    return (10 - (sum % 10)) % 10;
}
function generateEAN8(value) {

    let digits = String(value).replace(/\D/g, "");

    // EAN-8 requires 7 data digits
    digits = digits.padStart(7, "0").slice(-7);

    const checksum = calculateEAN8Checksum(digits);

    return digits + checksum;
}
function generateEAN13(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(12, "0").slice(-12);

    const checksum = calculateEANChecksum(digits);

    return digits + checksum;
}
function generateUPCA(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(11, "0").slice(-11);

    const checksum = calculateEANChecksum(digits);

    return digits + checksum;
}
function generateITF14(value) {
    let digits = String(value).replace(/\D/g, "");

    digits = digits.padStart(13, "0").slice(-13);

    const checksum = calculateEANChecksum(digits);

    return digits + checksum;
}
export function getBarcodeValue(value, barcodeSettings = {}) {

    if (!value) return "";

    const format =
        barcodeSettings.barcode_format || "CODE128";

    if (format === "CODE128") {

        return String(value)
            .trim()
            .replace(/[\r\n\t]/g, "");

    }

    if (format === "Code39") {

        return String(value)
            .toUpperCase()
            .replace(/[^0-9A-Z \-.$/+%]/g, "");

    }

    switch (format) {

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
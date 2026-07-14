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
export function detectBarcodeFormat(
    barcode,
    barcodeSettings
) {

    if (!barcodeSettings) {
        return "CODE128";
    }

    if (
        barcodeSettings.auto_detect_gtin_format
    ) {

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
                return "CODE128";
        }

    }

    return barcodeSettings.barcode_format || "CODE128";

}
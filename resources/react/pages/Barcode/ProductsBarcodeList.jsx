import React, { useEffect, useState } from "react";
import { Page, Box, Spinner, Text } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";

import BarcodeBulkAction from "../../components/barcode/BarcodeToolbar";
import BarcodeProductTable from "../../components/barcode/BarcodeTable";
import { generateBarcode } from "../../components/barcode/BarcodeUtils";

export default function ProductsBarcodeList() {

    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;

    const [variants, setVariants] = useState([]);
    const [barcodeSettings, setBarcodeSettings] = useState(null);

    const [selectedItems, setSelectedItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const onSelectionChange = (selectionType, isSelected, selection) => {

        if (selectionType === "all") {

            setSelectedItems(
                isSelected
                    ? variants.map(item => item.variant_id)
                    : []
            );

            return;
        }

        setSelectedItems(selection);
    };

    async function handleGenerateBarcodes() {

        console.log("Button Clicked");

        try {

            setLoading(true);

            const selectedVariants = variants
                .filter(item =>
                    selectedItems.includes(item.variant_id)
                )
                .map(item => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    suggested_barcode: generateBarcode(
                        item,
                        barcodeSettings
                    ),
                }));

            console.log(selectedVariants);

            const response = await fetch(
                "/api/products/barcode-update",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        product_id: selectedVariants[0].product_id,
                        variants: selectedVariants.map(item => ({
                            variant_id: item.variant_id,
                            suggested_barcode: generateBarcode(
                                item,
                                barcodeSettings
                            )
                        }))
                    }),
                }
            );

            console.log(response.status);

            const json = await response.json();

            console.log("HTTP Status:", response.status);
            console.log("API Response:", json);

            if (json.status === 1) {

                appBridge.toast.show(
                    "Barcode updated successfully"
                );

                setSelectedItems([]);

                await loadData();

            } else {

                throw new Error(
                    json.error || "Barcode update failed."
                );

            }

        } catch (e) {

            console.error(e);

            setError(e.message);

        } finally {

            setLoading(false);

        }

    }

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {

        try {

            setLoading(true);
            setError("");

            const [productRes, settingRes] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/barcode-settings"),
            ]);

            const products = await productRes.json();
            const settings = await settingRes.json();

            if (!products.status) {
                throw new Error(products.error);
            }

            setVariants(products.variants);

            setBarcodeSettings(settings);

        } catch (err) {

            setError(err.message);

        } finally {

            setLoading(false);

        }


    }

    if (loading) {

        return (
            <Box padding="1200" align="center">
                <Spinner size="large" />
                <Box paddingBlockStart="300">
                    <Text as="p">
                        Loading Products...
                    </Text>
                </Box>
            </Box>
        );

    }
    console.log("handleGenerateBarcodes:", handleGenerateBarcodes);
    return (

        <Page title="Inventory Barcode Management">

            <BarcodeBulkAction
                selectedCount={selectedItems.length}
                onGenerate={handleGenerateBarcodes}
            />

            <BarcodeProductTable
                variants={variants}
                selectedItems={selectedItems}
                onSelectionChange={onSelectionChange}
                barcodeSettings={barcodeSettings}
            />

        </Page>

    );

}
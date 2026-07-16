import React, { useEffect, useState } from "react";
import { Page, Box, Spinner, Text, useIndexResourceState, } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import BarcodeBulkAction from "../../components/barcode/BarcodeToolbar";
import BarcodeProductTable from "../../components/barcode/BarcodeTable";
import { generateBarcode } from "../../components/barcode/BarcodeUtils";

export default function ProductsBarcodeList() {

    const appBridge = useAppBridge();
    const fetch = appBridge.fetch || window.fetch;
    const [variants, setVariants] = useState([]);
    const {
        selectedResources,
        handleSelectionChange,
        clearSelection,
    } = useIndexResourceState(variants, {
        resourceIDResolver: (item) => item.variant_id,
    });

    const [barcodeSettings, setBarcodeSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tableKey, setTableKey] = useState(0);

    function handleGenerateBarcodes() {
        const updatedVariants = variants.map(item => {
            if (!selectedResources.includes(item.variant_id)) {
                return item;
            }
            return {
                ...item,
                generated_barcode: generateBarcode(
                    item,
                    barcodeSettings
                ),
            };
        });

        setVariants(updatedVariants);
        appBridge.toast.show(
            "Barcode Preview Generated"
        );

    }
    async function handleSaveBarcodes() {
        console.log("SAVE BUTTON CLICKED");
        try {
            setLoading(true);
            // Only selected rows with generated barcode
            const selectedVariants = variants.filter(
                item =>
                    selectedResources.includes(item.variant_id) &&
                    item.generated_barcode
            );
            if (selectedVariants.length === 0) {
                appBridge.toast.show(
                    "Generate barcode first."
                );
                return;
            }

            // Group by Product ID
            const groupedProducts = {};
            selectedVariants.forEach(item => {
                if (!groupedProducts[item.product_id]) {
                    groupedProducts[item.product_id] = [];
                }

                groupedProducts[item.product_id].push({
                    variant_id: item.variant_id,
                    suggested_barcode: item.generated_barcode,
                });
            });
            console.log("Grouped Products:", groupedProducts);
            // Save every product separately
            for (const productId of Object.keys(groupedProducts)) {
                console.log("Saving Product:", productId);
                console.log(groupedProducts[productId]);

                const response = await fetch(
                    "/api/products/barcode-update",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify({

                            product_id: productId,

                            variants: groupedProducts[productId],

                        }),
                    }
                );

                const json = await response.json();
                console.log(json);
                if (!response.ok || json.status !== 1) {
                    throw new Error(
                        json.error || "Unable to save barcode."
                    );
                }
            }

            appBridge.toast.show(
                "Barcode saved successfully."
            );
            await loadData();
            clearSelection(); 
            setTableKey(prev => prev + 1);
        } catch (e) {
            console.error(e);
            appBridge.toast.show(
                e.message
            );

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

            setVariants(
                products.variants.map(item => ({
                    ...item,
                    generated_barcode: "",
                }))
            );
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
    return (

        <Page title="Inventory Barcode Management">

            <BarcodeBulkAction
                selectedCount={selectedResources.length}
                onGenerate={handleGenerateBarcodes}
                onSave={handleSaveBarcodes}
            />

            <BarcodeProductTable
                key={tableKey}
                variants={variants}
                selectedItems={selectedResources}
                onSelectionChange={handleSelectionChange}
                barcodeSettings={barcodeSettings}
            />

        </Page>

    );

}
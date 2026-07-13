import {
    IndexTable,
    Thumbnail,
    Badge,
    Text,
    Box,
} from "@shopify/polaris";
import React from "react";
import { generateBarcode } from "./BarcodeUtils";

export default function BarcodeTable({
    variants,
    selectedItems,
    onSelectionChange,
    barcodeSettings,
}) {

    const resourceName = {
        singular: "variant",
        plural: "variants",
    };

    const allSelected =
        variants.length &&
        variants.length === selectedItems.length;

    return (
        <IndexTable
            resourceName={resourceName}
            itemCount={variants.length}
            selectedItemsCount={
                allSelected ? "All" : selectedItems.length
            }
            onSelectionChange={onSelectionChange}
            headings={[
                { title: "Image" },
                { title: "Product" },
                { title: "Current Barcode" },
                { title: "Generated Barcode" },
                { title: "Price" },
            ]}
        >
            {variants.map((item, index) => (
                <IndexTable.Row
                    id={item.variant_id}
                    key={item.variant_id}
                    position={index}
                    selected={selectedItems.includes(
                        item.variant_id
                    )}
                >
                    <IndexTable.Cell>
                        <Thumbnail
                            source={item.image}
                            size="small"
                            alt=""
                        />
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Text fontWeight="bold">
                            {item.product_title}
                        </Text>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Badge>
                            {item.barcode || "None"}
                        </Badge>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Text
                            fontWeight="bold"
                            tone="success"
                        >
                            {generateBarcode(item, barcodeSettings)}
                        </Text>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        ${item.price}
                    </IndexTable.Cell>
                </IndexTable.Row>
            ))}
        </IndexTable>
    );
}
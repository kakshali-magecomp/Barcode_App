import React from "react";
import {
    IndexTable,
    Thumbnail,
    Badge,
    Text,
} from "@shopify/polaris";

export default function BarcodeTable({
    variants,
    selectedItems,
    onSelectionChange,
}) {

    const resourceName = {
        singular: "variant",
        plural: "variants",
    };

    const allSelected =
        variants.length > 0 &&
        selectedItems.length === variants.length;

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
                    selected={selectedItems.includes(item.variant_id)}
                >
                    <IndexTable.Cell>
                        <Thumbnail
                            source={item.image || ""}
                            alt={item.product_title}
                            size="small"
                        />
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Text
                            as="span"
                            variant="bodyMd"
                            fontWeight="bold"
                        >
                            {item.product_title}
                        </Text>

                        {item.variant_title !== "Default Title" && (
                            <>
                                <br />
                                <Text
                                    as="span"
                                    variant="bodySm"
                                    tone="subdued"
                                >
                                    {item.variant_title}
                                </Text>
                            </>
                        )}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Badge tone="info">
                            {item.barcode || "None"}
                        </Badge>
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        {item.generated_barcode ? (
                            <Badge tone="success">
                                {item.generated_barcode}
                            </Badge>
                        ) : (
                            <Text
                                as="span"
                                tone="subdued"
                            >
                                -
                            </Text>
                        )}
                    </IndexTable.Cell>

                    <IndexTable.Cell>
                        <Text as="span">
                            ${item.price}
                        </Text>
                    </IndexTable.Cell>

                </IndexTable.Row>
            ))}
        </IndexTable>
    );
}
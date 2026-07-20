<?php

namespace App\Helpers;

class ShopifyQueryHelper
{

    public static function showproduct(): string
    {
        return <<<'GRAPHQL'
    {
        products(first: 50) {
            edges {
                node {
                    id
                    title
                    vendor
                    productType
                    handle         # ADDED: Essential for building safe fallback URLs
                    onlineStoreUrl # ADDED: The authentic, live store page link

                    metafields(first: 20){
                        edges{
                            node{
                                namespace
                                key
                                value
                            }
                        }
                    }
                    featuredImage {
                        url
                    }
                    variants(first: 100) {
                        edges {
                            node {
                                id
                                title
                                price
                                sku
                                barcode
                                 inventoryItem {
                                    id
                                }
                                selectedOptions {
                                    name
                                    value
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    GRAPHQL;
    }

    public static function updateInventoryItem(): string
    {
        return <<<'GRAPHQL'
    mutation inventoryItemUpdate(
        $id: ID!,
        $input: InventoryItemInput!
    ) {
        inventoryItemUpdate(
            id: $id,
            input: $input
        ) {
            inventoryItem {
                id
                sku
            }
            userErrors {
                field
                message
            }
        }
    }
    GRAPHQL;
    }
    public static function updateBarcode(): string
{
    return <<<'GRAPHQL'
    mutation updateProductVariantBarcode(
        $productId: ID!,
        $variants: [ProductVariantsBulkInput!]!
    ) {
        productVariantsBulkUpdate(
            productId: $productId,
            variants: $variants
        ) {
            productVariants {
                id
                barcode
            }
            userErrors {
                field
                message
            }
        }
    }
    GRAPHQL;
}

}
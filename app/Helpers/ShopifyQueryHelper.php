<?php

namespace App\Helpers;

class ShopifyQueryHelper
{

    public static function showproduct(): string
    {
        return <<<'GRAPHQL'
    {
        products(first: 100) {
            edges {
                node {
                    id
                    title
                    vendor
                    productType
                    handle        
                    onlineStoreUrl 
                    status

                    metafields(first: 100){
                        edges{
                            node{
                                namespace
                                key
                                value
                                definition {
                                    id
                                    name
                                }
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
    public static function metafieldDefinitions(): string
    {
        return <<<'GRAPHQL'
    {
        metafieldDefinitions(first: 250, ownerType: PRODUCT) {
            edges {
                node {
                    id
                    name
                    namespace
                    key
                }
            }
        }
    }
    GRAPHQL;
    }
    public static function updateSku(): string
    {
        return <<<'GRAPHQL'
mutation updateProductVariantSku(
    $productId: ID!,
    $variants: [ProductVariantsBulkInput!]!
) {
    productVariantsBulkUpdate(
        productId: $productId,
        variants: $variants
    ) {
        productVariants {
            id
            inventoryItem {
                sku
            }
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
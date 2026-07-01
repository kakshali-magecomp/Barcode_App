<?php

namespace App\Helpers;

class ShopifyQueryHelper
{
    /**
     * Fetch Shopify products with variants
     */
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
        featuredImage {
          url
        }
        variants(first: 20) {
          edges {
            node {
              id
              title
              sku
              barcode
              price
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

    /**
     * Update one or more variants of a product
     */
    public static function updateVariant(): string
    {
        return <<<'GRAPHQL'
mutation productVariantsBulkUpdate(
  $productId: ID!,
  $variants: [ProductVariantsBulkInput!]!
) {
  productVariantsBulkUpdate(
    productId: $productId,
    variants: $variants
  ) {
    productId {
      id
    }
    variants {
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
}
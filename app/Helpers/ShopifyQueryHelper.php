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
                        featuredImage {
                                id
                                url
                                altText
                      }
                        variants(first: 20) {
                            edges {
                                node {
                                    id
                                    title
                                    price
                                    sku
                                    barcode
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


  public static function updateVariant(): string
  {
    return <<<'GRAPHQL'
        mutation productVariantUpdate($input: ProductVariantInput!) {
            productVariantUpdate(input: $input) {
                productVariant {
                    id
                    sku
                    title
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

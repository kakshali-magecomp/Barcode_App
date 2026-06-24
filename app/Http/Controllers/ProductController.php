<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $shop = Session::first();

        $client = new Graphql(
            $shop->shop,
            $shop->access_token
        );

        $query = <<<GRAPHQL
        {
          products(first: 50) {
            edges {
              node {
                id
                title

                variants(first: 20) {
                  edges {
                    node {
                      id
                      sku
                      barcode
                    }
                  }
                }
              }
            }
          }
        }
        GRAPHQL;

        $response = $client->query([
            "query" => $query
        ]);

        return response()->json(
            $response->getDecodedBody()
        );

    }
}

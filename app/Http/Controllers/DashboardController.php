<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Helpers\ShopifyQueryHelper;

class DashboardController extends Controller
{
    
    public function index()
    {
        $user = Auth::user();

        //Compute total layouts designed by this shop in the local table database
        $templatesCount = $user->barcodeTemplates()->count();

        //Fetch total live store product count directly out of Shopify's GraphQL count headers
        $countQuery = '{ products(first: 1) { pageInfo { hasNextPage } } }';
        
        // Default safe baseline fallback count metric definition
        $productsCount = 0; 
        
        try {
            // Re-use our existing GraphQL query helper list to count total edges rows array items lengths
            $listQuery = ShopifyQueryHelper::showproduct();
            $rawResponse = $user->api()->graph($listQuery);
            $responseArray = json_decode(json_encode($rawResponse), true);
            
            $edges = $responseArray['body']['container']['data']['products']['edges'] ?? 
                     $responseArray['body']['data']['products']['edges'] ?? [];
                     
            $productsCount = count($edges);
        } catch (\Exception $e) {
            // Continue processing gracefully if API handshake drops out temporary
        }

        return response()->json([
            'templates_count' => $templatesCount,
            'products_count'  => $productsCount
        ], 200);
    }
}

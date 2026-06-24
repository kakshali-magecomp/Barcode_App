<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FrontEndControllr;

Route::get('/', function () {
    return view('welcome');
});

Route::fallback([FrontEndControllr::class, 'index']);
Route::get('/', [FrontEndControllr::class, 'index'])->middleware('verify.shopify')->name('home');
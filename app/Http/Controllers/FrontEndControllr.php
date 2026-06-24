<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FrontEndControllr extends Controller
{
    public function index()
    {
        return view('welcome');
    }
}

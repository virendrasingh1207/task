<?php
//header("Access-Control-Allow-Origin:*");
header("Access-Control-Allow-Headers: Authorization, Content-Type");


use Illuminate\Http\Request;
/*
header ("Access-Control-Allow-Origin: *");
header ("Access-Control-Expose-Headers: Content-Length, X-JSON");
header ("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");
header ("Access-Control-Allow-Headers: *");
*/

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/


Route::group(['namespace' => 'App\Http\Controllers\Api'], function () {       
    Route::post('login', 'UserController@login');    
});

Route::group(['middleware' => ['jwt.auth'], 'namespace' => 'App\Http\Controllers\Api'], function (){
    Route::post('update-profile-image', 'UserController@updateProfileImage');  
});

Route::fallback(function () {
    return response()->json(['status'=>False,'message'=>'Please verify api method or data.','data'=>[]],400);
});





<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use App\Models\User;
use Auth;
use Hash;
use File;
use JWTAuth;
use JWTAuthException;

class UserController extends Controller
{
    public function login(Request $request)
    {   
        $validatorRules = [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ];
        try {
            $validator = Validator::make($request->all(), $validatorRules);
            if($validator->fails()) 
            {
                $error = $validator->messages()->first();
                $response = ['status' => false, 'message' => $error,'data'=>(object)[]];
                return response()->json($response,400);
            }
            $credentials = $request->only('email', 'password');
            if($token=JWTAuth::attempt($credentials)){
                    //$token = JWTAuth::fromUser($user);
                    $response = ['status' => true, 'message'=>'You are logged in successfully.', 'data'=>JWTAuth::user(), 'token'=>$token];
                    return response()->json($response,200);

            }else{
                $response = ['status' => false, 'message' =>'Invalid Credentials','data'=>(object)[]];
                return response()->json($response,401);
            }
            
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message'=>$e,'data'=>(object)[]],400);
        }
    }
    
    public function updateProfileImage(Request $request)
    {   
        $user_id = JWTAuth::user()->id;
        $validatorRules = [
            'image' => 'required|mimes:jpg,jpeg,png,bmp,svg|max:500',
        ];
        try {
            $validator = Validator::make($request->all(), $validatorRules);

            if($validator->fails()) 
            {
                $error = $validator->messages()->first();
                $response = ['status' => false, 'message' => $error];
                return response()->json($response);
            }
            $user = User::where(["id"=>$user_id])->first();
            if(empty($user))
            {
                $response = ['status' => false, 'message' => "Account doesn't exist."];
                return response()->json($response,400);
            }
            if($request->file('image')) 
            {
                /*delete previous one*/
                if(!empty($user->image) && File::exists(public_path('uploads/users/'.$user->image))){
                File::delete(public_path('uploads/users/'.$user->image));
                }
                $file = $request->file('image');
                $originalname = $file->getClientOriginalName();
                $file_name = time()."_".$originalname;
                $file->move('public/uploads/users/',$file_name);
                $user['image'] = $file_name;
            }
            $user->save();
            $response = ['status' => true, 'message'=>'Image has been updated successfully.'];
            return response()->json($response,200);
        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message'=>"Something went wrong"],400);
        }
    }
}
?>
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class isBlocked
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {   
        log::debug('tetttt');
        if(!isset(auth()->user()->status) || auth()->user()->status == 1){
            return $next($request);
        }elseif(auth()->user()->status == 2){
            return response()->json([
                'status_code' => 300,
                'response' => 'error',
                'message' => 'Your account is deactivated by admin. Please contact Jaby Job Support.'
            ]);
        }else{
            return response()->json([
                'status_code' => 300,
                'response' => 'error',
                'message' => 'Your account is temporarily inactive. Please contact Jaby Job Support.'
            ]);
        }
        return $next($request);
    }
}

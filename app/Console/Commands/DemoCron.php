<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use DB;
use App\Models\User;
use App\Models\Notification;
use App\Helpers\Helper;

class DemoCron extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'demo:cron';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notify user that your plan is near to expire before 15 days';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        \Log::info("Cron is working fine!");
        $end_date = date('Y-m-d', strtotime('+15 days'));
        $data = DB::table('purchase_plans')->where('end_date','<=',$end_date)->pluck('user_id')->all();
        $message = "Your subscription will be expire soon please renew before expire";
        $fcm_token = User::whereIN('id',$data)
                                ->whereNotNull('device_token')
                                ->where('device_type',1)
                                ->pluck('device_token')->all();
        Helper::HurryAndroid($fcm_token,$message);
        foreach($data as $value){
            Notification::create([
                'user_id'=>$value,
                'message'=>$message,

            ]);
        }

        /*Ios Function Call*/
        $fcm_token_ios = User::whereIN('id',$data)
                            ->whereNotNull('device_token')
                            ->where('device_type',2)
                            ->pluck('device_token')->all();
        Helper::HurryIos($fcm_token_ios,$message);
        
    }
}

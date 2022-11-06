<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use DB;
use App\Models\User;
use App\Models\Notification;
use App\Helpers\Helper;

class PlanCron extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'plan:cron';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check user plan if and expire according to end date';

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
        \Log::info("Cron Check user plan if and expire according to end date run");
        $currentdate = date('Y-m-d');

        $users = DB::table('purchase_plans')->where('end_date',$currentdate)->pluck('user_id')->all();
        DB::table('purchase_plans')->where('end_date',$currentdate)->update(['is_active'=>2]);
        User::whereIN('id',$users)->update(['subscription_status'=>2]);


        $postPlan = DB::table('purchase_plans')->where(['from_date'=>$currentdate,'is_active'=>0])->pluck('user_id')->all();
        DB::table('purchase_plans')->where(['from_date'=>$currentdate,'is_active'=>0])->update(['is_active'=>1]);
        User::whereIN('id',$postPlan)->update(['subscription_status'=>1]);

        /*------------------- For those who plan expired and don't have Post Plan ------------------------------*/
        $message = "Your subscription has been expired and your video is not visible to other users,please renew your subscription to cotinue your services.";
        $fcm_token = User::whereIN('id',$users)
                                ->whereNotNull('device_token')
                                ->pluck('device_token')->all();
        Helper::HurryAndroid($fcm_token,$message);
        foreach($users as $value){
            Notification::create([
                'user_id'=>$value,
                'message'=>$message,

            ]);
        }

        /*------------------- For those who have Post Plan ------------------------------*/
        $message = "Your subscription has been renewd and your video is visible continuously to other users.";
        $fcm_token = User::whereIN('id',$postPlan)
                                ->whereNotNull('device_token')
                                ->pluck('device_token')->all();
        Helper::HurryAndroid($fcm_token,$message);
        foreach($users as $value){
            Notification::create([
                'user_id'=>$value,
                'message'=>$message,

            ]);
        }
    }
}

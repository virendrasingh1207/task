

<!DOCTYPE html>
<html>
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>Jaby Job Merchant</title>
      <meta name="viewport" content="width=device-width" ,="" initial-scale="1.0/">
      <meta http-equiv="X-UA-Compatible" content="IE=Edge,chrom=1">
      <script src="js/jquery-1.8.3.min.js"></script>
      <!--<script id = "myScript" src="https://scripts.pay.bka.sh/versions/1.2.0-beta/checkout/bKash-checkout.js"></script>-->
       <script id = "myScript" src="https://scripts.sandbox.bka.sh/versions/1.2.0-beta/checkout/bKash-checkout-sandbox.js"></script>
   </head>
   <body class="clean-body" style="margin: 0; padding: 0; -webkit-text-size-adjust: 100%; background-color: #FFFFFF;">
      <table bgcolor="#FFFFFF" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="table-layout: fixed; vertical-align: top; min-width: 320px; Margin: 0 auto; border-spacing: 0; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF; width: 100%;" valign="top" width="100%">
         <tbody>
            <tr style="vertical-align: top;" valign="top">
               <td style="word-break: break-word; vertical-align: top;" valign="top">
                  <div style="background-color:transparent;">
                     <div class="block-grid" style="Margin: 0 auto; min-width: 320px; max-width: 500px; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word; background-color: transparent;">
                        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
                           <div class="col num12" style="min-width: 320px; max-width: 500px; display: table-cell; vertical-align: top; width: 500px;">
                              <div style="width:100% !important;">
                                 <div style="border-top:0px solid transparent; border-left:0px solid transparent; border-bottom:0px solid transparent; border-right:0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;">
                                   <div align="center" class="img-container center autowidth" style="padding-right: 0px;padding-left: 0px;">
                                       <img align="center" alt="bKash logo" border="0" class="center autowidth" src="images/bkash90px.png" style="text-decoration: none; -ms-interpolation-mode: bicubic; border: 0; height: auto; width: 100%; max-width: 91px; display: block;" title="bKash logo" width="91"/>
                                    </div>
                                    <div style="color:#555555;font-family:'Ubuntu', Tahoma, Verdana, Segoe, sans-serif;line-height:1.2;padding-top:10px;padding-right:10px;padding-bottom:10px;padding-left:10px;">
                                       <div style="line-height: 1.2; font-size: 12px; font-family: 'Ubuntu', Tahoma, Verdana, Segoe, sans-serif; color: #555555; mso-line-height-alt: 14px;">
                                          <p style="font-size: 22px; line-height: 1.2; word-break: break-word; text-align: center; font-family: 'Ubuntu', Tahoma, Verdana, Segoe, sans-serif; mso-line-height-alt: 26px; margin: 0;"><span style="font-size: 22px;"><strong>Pay with bKash<br/></strong></span></p>
                                       </div>
                                    </div>
                                    <div align="center" class="img-container center fixedwidth">
                                       <img align="center" border="0" class="center fixedwidth" src="https://media3.giphy.com/media/y1ZBcOGOOtlpC/giphy.gif?cid=20eb4e9d106dafb8132de4958ccc68303fed05a4ff01c4e8&amp;rid=giphy.gif" style="text-decoration: none; -ms-interpolation-mode: bicubic; border: 0; height: auto; width: 100%; max-width: 100px; display: block;" width="100"/>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </td>
            </tr>
         </tbody>
      </table>
      <button style="display:none" align="center" id="bKash_button">Pay With bKash</button>
      <script type="text/javascript">
      
         var accessToken='';
         var pay_amount='0';
         
        function getAmount(val){
            pay_amount=val;
            console.log('getAmount ='+ pay_amount);
            checkPaymentNow();
        }
         
    function checkPaymentNow(){
         
              var paymentConfig={
                     createCheckoutURL:"createpayment.php",
                     executeCheckoutURL:"executepayment.php",
              };
         
             var paymentRequest;
             paymentRequest = { amount:pay_amount,intent:'sale'};
             console.log('paymentRequest = '+JSON.stringify(paymentRequest));
        
             $.ajax({
                 url: "token.php",
                 type: 'POST',
                 contentType: 'application/json',
                 success: function (data) {
                 accessToken=JSON.stringify(data);
                 console.log('accessToken = '+ accessToken);
                 },
                 
                 error: function(){
                    //console.log('error');
                 }
             });
         
             bKash.init({
                 paymentMode: 'checkout',
                 paymentRequest: paymentRequest,
                 createRequest: function(request){
                     $.ajax({
                         url: paymentConfig.createCheckoutURL+"?amount="+paymentRequest.amount,
                         type:'GET',
                         contentType: 'application/json',
                         success: function(data) {
                             
                             console.log('createRequest = ' + JSON.stringify(data));
                             
                             var obj = JSON.parse(data);
                             
                             if(data && obj.paymentID != null){
                                 paymentID = obj.paymentID;
                                 bKash.create().onSuccess(obj);
                             }
                             else {
                                 //console.log('error');
                                 bKash.create().onError();
                             }
                         },
                         error: function(){
                             //console.log('error');
                             bKash.create().onError();
                         }
                     });
                 },
                 
                 executeRequestOnAuthorization: function(){
                     
                     $.ajax({
                         url: paymentConfig.executeCheckoutURL+"?paymentID="+paymentID,
                         type: 'GET',
                         contentType:'application/json',
                         success: function(data){
                             
                             console.log('executeRequest = '+ JSON.stringify(data));
                             
                             data = JSON.parse(data);
                             if(data && data.paymentID != null){
                            
                                 var value1=data.paymentID;
                                 var value2=data.trxID;
                                 var value3=data.amount;
                                 var queryString = "?PaymentID= " + value1 + "&TransactionID= " + value2+ "&Amount= " + value3;
                                 window.location.href = "success.html"+ queryString;
                                 
                                          
                                backToAndroidActivity(JSON.stringify(data));
                             }
                             else {
                                 bKash.execute().onError();
                             }
                         },
                         error: function(){
                             bKash.execute().onError();
                         }
                     });
                 }
             });
             
         //console.log("Right after init ");
             
         }
         
         //android app call this function first then clickPayButton() function then getAmountFunction
         //checkPaymentNow will start the pay process. 
         function callReconfigure(val){
             bKash.reconfigure(val);
         }
         
         function clickPayButton(){
             $("#bKash_button").trigger('click');
         }
         
         function backToAndroidActivity(queryString){
            Your11Payment.OnPaymentSuccess(queryString);
         }
         
         
      </script>
   </body>
</html>


'use strict';
require('dotenv').config();
const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require('express');
const axios = require("axios")
const multer  = require('multer');
const app = express();
const bodyParser = require("body-parser");
const httpServer = createServer(app);
const apn = require("node-apn");
const io = new Server(httpServer, { cors:'*',allowEIO3: true });

app.use(express.json());
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(express.static(__dirname + '/'));

//Firebase
const FCM = require('fcm-node');
const serverKey = 'AAAAGq2SkD4:APA91bGHxGdV0czY027BrLIDmUSe_Qd7JUmyJZGVg983phJJ2JAPe2hgMFo9wQC3fndrAOahkeCdu6_ByQqtNt4rAzCQrKMLXugXmDf8c6ArOFca2LYPLJkX4wqOhqIKAuE-omFdaF6D';
var fcm = new FCM(serverKey);

/*-------------------- Database Connection Setup Start -----------------*/
const mysql = require("mysql");
//create db connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset : 'utf8mb4'
  });
//connect
db.connect(function(err){
    if(err){
        throw err;
        //console.log('Error connecting to Db'); 
        //return;
    }
    console.log('Database Connection established');
});
/*-------------------- Database Connection Setup End -----------------*/
function returnDateTimeForSql(date_ob)
{
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = date_ob.getHours();
    let minutes = date_ob.getMinutes();
    let seconds = date_ob.getSeconds();
    let currentDateTime = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;
    return currentDateTime;
}

function sendAndroidNotify(receiverDeviceToken,message,userId,username)
{
        var bodyDetails = "";

        if((userId>0)||(username!=''))
        {
            bodyDetails = {"userId":userId,"username":"","message":message};
        }
        
        if((userId==0)||(username==''))
        {
            bodyDetails = message;
        }
        
        var fireBaseMessage = {
        to:receiverDeviceToken,
            notification: {
                title: 'Notifcation from Chat',
                body: bodyDetails,
            }
        };

        fcm.send(fireBaseMessage, function(err, response) {
            if (err) {
                console.log("Firebase - Something has gone wrong!"+err);
            } else {
                // showToast("Successfully sent with response");
                console.log("Firebase - Successfully sent with response: ", response);
            }
        });
}

function sendIosNotify(receiverDeviceToken,message,userId,username)
{        
        var fireBaseMessage = {
        to:receiverDeviceToken,
            notification: {
                title: 'Notifcation from Chat',
                body: message,
                userId:userId,
                userName:"",
            }
        };
        fcm.send(fireBaseMessage, function(err, response) {
            if (err) {
                console.log("Firebase - Something has gone wrong!"+err);
            } else {
                // showToast("Successfully sent with response");
                console.log("Firebase - Successfully sent with response: ", response);
            }
        });
}

io.use((socket, next) => {
    next();
});

/*----------------------------- Api from Send Notification Through Firebase ---------------*/
app.post('/send-notification',function (req, res) {
     //console.log(req); 
     var reqJson = JSON.parse(Object.keys(req.body)[0]);  
     console.log(reqJson);

     var token    = reqJson.token;
     var message  = reqJson.message;
     var userId   = 0;
     var username = '';

     //console.log("T-> "+token);

     if(token==undefined)
     {
        return res.send("Notification not Sent Successfully");   
     }

     if(token!=undefined)
     {
        sendAndroidNotify(token,message,userId,username);
        return res.send("Notification Sent Successfully");   
     }
});

//Socket Events Start
io.on("connection", (socket) => {
        var socketId = socket.id;   //console.log('SocketId -> '+socketId);
        var date_ob = new Date();
        var currentDateTime = returnDateTimeForSql(date_ob);
        var chatPerPage = 5;

        socket.on('firstKey', async (message) => {
            console.log("From Device: "+message+"\n");
            io.sockets.emit('testKey', "Message from node on jaby job ->"+message);
        });
        
        socket.on('setStatus', function (arr) {
            var from_id = arr['sender'];
            var date_ob1 = new Date();
            var currentTime = returnDateTimeForSql(date_ob1); 
            var updateSocketIdSql = 'update users set last_activity="'+currentTime+'",is_online=1 where id="'+from_id+'"';

            var query = db.query(updateSocketIdSql, function(err, result) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql);    
            });  
             //console.log("\n Status Set=> "+from_id+"\n");
        });

        socket.on('getStatus', (arr) => {
            var to_id = arr['receiver'];

            var findSocketIdSql = 'SELECT last_activity FROM users where id="'+to_id+'"';
            //console.log(findSocketIdSql+"\n");
            db.query(findSocketIdSql, function (err, result, fields) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 

                var last_activity = result[0]['last_activity']; 

                var date_ob1 = new Date();
                var currentTime = returnDateTimeForSql(date_ob1); 
                currentTime = new Date(currentTime).getTime(); 
                last_activity   = new Date(last_activity).getTime();   
                var seconds = Math.abs((currentTime - last_activity) / 1000);
                var onlineStatus = 1;

                if(seconds>30)
                {
                    onlineStatus = 0;
                    var updateStatus = 'update users set is_online=0 where id="'+to_id+'"'; 
                    var query = db.query(updateStatus, function(err, result) {
                        //if (err) throw err;   
                        if (err) console.log("Err-> "+err.sql);     
                    });  
                }

                io.to(socketId).emit('getStatus', onlineStatus);
                 //console.log("\nStatus "+onlineStatus+" Sec-> "+seconds);
           });
        });

        socket.on('saveSocketId', function (arr) {
            //console.log("Arr-> "+arr+"\n");
            var from_id = arr['sender'];
            var to_id   = arr['receiver'];
            var updateSocketIdSql = 'update users set socket_id="'+socketId+'",socket_id_with="'+to_id+'",last_activity="'+currentDateTime+'" where id="'+from_id+'" '; 
            console.log("\nSAVE=> "+updateSocketIdSql+"\n");
            var query = db.query(updateSocketIdSql, function(err, result) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql);    
                var numRows = result.affectedRows;

                var findUserDetails = 'select * from users where id="'+to_id+'"';
                    //console.log(findSocketIdSql+"\n");
                    db.query(findUserDetails, function (err, result, fields) {
                        //if (err) throw err;   
                        if (err) console.log("Err-> "+err.sql); 
                        io.to(socketId).emit('userDetails', result);
                });

                var findTotalPage = 'SELECT (count(*)/5) as totalPage FROM chats where (sender="'+from_id+'" and receiver="'+to_id+'") or (sender="'+to_id+'" and receiver="'+from_id+'")';
                    //console.log(findSocketIdSql+"\n");
                    db.query(findTotalPage, function (err, result, fields) {
                        //if (err) throw err;   
                        if (err) console.log("Err-> "+err.sql); 
                        var totalPage = Math.ceil(result[0]['totalPage']); 
                        console.log("TP-> "+totalPage);
                        io.to(socketId).emit('totalPage', totalPage);
                });

                if(numRows==1)
                {
                    var updateSeenStatus = 'update chats set status=1 where receiver="'+from_id+'" and sender="'+to_id+'"'; 
                    var query = db.query(updateSeenStatus, function(err, result) {
                        //if (err) throw err;   
                        if (err) console.log("Err-> "+err.sql);     
                    });  

                    var findSocketIdSql = 'SELECT * FROM chats where (sender="'+from_id+'" and receiver="'+to_id+'") or (sender="'+to_id+'" and receiver="'+from_id+'") order by id desc limit '+chatPerPage+'';
                        //console.log(findSocketIdSql+"\n");
                        db.query(findSocketIdSql, function (err, result, fields) {
                            //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 

                            io.to(socketId).emit('saveSocketId', result);
                    });
                } 
            });  
        });

        socket.on('getMoreChat', function (arr) {
            var from_id = arr['sender'];
            var to_id   = arr['receiver'];
            var page    = arr['page'];
             
            var offSet = page * chatPerPage; 

            var getChatsSql = 'SELECT * FROM chats where (sender="'+from_id+'" and receiver="'+to_id+'") or (sender="'+to_id+'" and receiver="'+from_id+'") order by id desc limit '+offSet+','+chatPerPage+'';
            console.log(getChatsSql+"\n");
                db.query(getChatsSql, function (err, result, fields) {
                    //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 
                    io.to(socketId).emit('getMoreChat', result);
            });
        });  

        socket.on('totalUnreadMsg', function (arr) {
            var from_id = arr['sender'];

            var getTotalMsg = 'SELECT count(DISTINCT(sender)) as count FROM chats where receiver="'+from_id+'" and status=0 ';
            console.log(getTotalMsg+"\n");
                db.query(getTotalMsg, function (err, result, fields) {
                    //if (err) throw err;   
                    if (err) console.log("Err-> "+err.sql); 
                    var totalUnread = result[0]['count'];
                    io.to(socketId).emit('totalUnreadMsg', totalUnread);
            });
        });  

        socket.on('saveLeaveTab', function (arr) {
            var from_id = arr['sender'];
            var updateSocketIdSql = 'update users set socket_id_with=0,socket_id="" where id="'+from_id+'"'; 
            
            var query = db.query(updateSocketIdSql, function(err, result) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql);     
            });  

            console.log("\n Leave User=> "+from_id+"\n");
        });

        socket.on('typing', (arr) => {
            var from_id = arr['sender'];
            var to_id   = arr['receiver'];
            //console.log("Typing -> "+from_id);
            var findSocketIdSql = 'SELECT socket_id,socket_id_with FROM users where id="'+to_id+'"';
            //console.log(findSocketIdSql+"\n");
            db.query(findSocketIdSql, function (err, result, fields) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 
                var receiverSocketId = result[0]['socket_id']; 
                var senderUserId   = result[0]['socket_id_with'];
                
                socket.broadcast.to(receiverSocketId).emit('typing', 'Typing...');
                //console.log("\nTyping show to "+to_id);
           });
        });

        socket.on('typingOff', (arr) => {
            var from_id = arr['sender'];
            var to_id   = arr['receiver'];

            //console.log("TypingOff -> "+from_id);
            var findSocketIdSql = 'SELECT socket_id,socket_id_with FROM users where id="'+to_id+'"';
            //console.log(findSocketIdSql+"\n");
            db.query(findSocketIdSql, function (err, result, fields) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 
                var receiverSocketId = result[0]['socket_id']; 
                var senderUserId   = result[0]['socket_id_with'];
                //console.log("\nRSI fir Typing "+receiverSocketId);

                socket.broadcast.to(receiverSocketId).emit('typing', '');
                //console.log("\nTypingOff show to "+to_id);  
           });
        });

        socket.on('sendChatToServer', (arr) => {

        console.log("M Arr-> "+arr+"\n");    
        var from_id  = arr['sender'];
        var to_id    = arr['receiver'];
        var message  = arr['message'];
        var time     = arr['time'];
        var filetype = arr['filetype'];

        if(filetype==0)
        {
            if(message!='')
            {
                var insSql = 'INSERT INTO chats (sender, receiver, message,createdAt,updatedAt) VALUES ("'+from_id+'", "'+to_id+'", "'+message+'","'+time+'","'+currentDateTime+'")'; 
                //console.log(insSql+"\n");
                var query = db.query(insSql, function(err, result) {
                    //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql);     
                });    
            }              
        }

        if(filetype==1)
        {
            var file = arr['file'];
            var insSql = 'INSERT INTO chats (sender, receiver, message,fileType,file,createdAt,updatedAt) VALUES ("'+from_id+'", "'+to_id+'", "'+message+'","1","'+file+'","'+time+'","'+currentDateTime+'")'; 
            //console.log(insSql+"\n");
            var query = db.query(insSql, function(err, result) {
                //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql);     
            });  
        }
        
         //Find last message Id
        var lastMessageIdSql = 'SELECT max(id) as max FROM chats where receiver="'+to_id+'" and sender="'+from_id+'" ';
                        //console.log(lastMessageIdSql+"\n");
        db.query(lastMessageIdSql, function (err, result, fields) {
            //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 
            var lastMessageId = result[0]['max'];
            //console.log("LI=> "+lastMessageId);

            var findSendResult = 'SELECT * FROM chats where id='+lastMessageId+'';
                    //console.log(findSocketIdSql+"\n");
            db.query(findSendResult, function (err1, result1, fields1) {
                //if (err1) throw err1;
                if (err1) console.log("Err->"+err1.sql);  
                io.to(socketId).emit('sendChatToClient', result1);
                console.log("SR=> "+result1);
            });
        });

        var sendFirebaseNotification = 0;
        var findSocketIdSql = 'SELECT username,device_type,device_token,socket_id,socket_id_with,is_notification FROM users where id="'+to_id+'"';
        //console.log(findSocketIdSql+"\n");
        db.query(findSocketIdSql, function (err, result, fields) {
            //if (err) throw err;   
                if (err) console.log("Err-> "+err.sql); 
            var receiverDeviceType  = result[0]['device_type'];
            var receiverDeviceToken = result[0]['device_token'];
            var receiverSocketId = result[0]['socket_id']; 
            var senderUserId     = result[0]['socket_id_with'];
            var isNotification   = result[0]['is_notification']; 
            var receiverUserName = result[0]['username'];

            console.log("\nRSI "+receiverSocketId);

            if((receiverSocketId=='')||(receiverSocketId==null))
            {
                console.log("User Offline - Not login now\n");
                sendFirebaseNotification = 1;
            }

            if(((receiverSocketId!='')||(receiverSocketId!=null))&&(sendFirebaseNotification==0))
            {
                if(senderUserId==0)
                {
                    console.log("User online but don't chat with anyone - Home Screen\n");
                    sendFirebaseNotification =  1;
                }

                if(senderUserId>0)
                {
                    if(senderUserId!=from_id)
                    {
                        console.log("User online and chat with another person\n");
                        sendFirebaseNotification = 1;
                    }

                    if(senderUserId==from_id)
                    {  
                        //Find last message Id
                        var lastMessageIdSql = 'SELECT max(id) as max FROM chats where receiver="'+to_id+'" and sender="'+from_id+'" ';
                        
                        db.query(lastMessageIdSql, function (err, result, fields) {
                            //if (err) throw err;   
                            if (err) console.log("Err-> "+err.sql); 
                            var lastMessageId = result[0]['max'];
                            //console.log("LI=> "+lastMessageId);

                            var findSendResult = 'SELECT * FROM chats where id='+lastMessageId+'';
                                                //console.log(findSocketIdSql+"\n");
                            db.query(findSendResult, function (err1, result1, fields1) {
                                //if (err1) throw err1;
                                if (err1) console.log("Err->"+err1.sql);  
                                socket.broadcast.to(receiverSocketId).emit('sendChatToClient', result1);
                                console.log("Message Send from "+from_id+" to  "+to_id+" \n"); 
                            });

                            var updateSocketIdSql = 'update chats set status=1,updatedAt="'+currentDateTime+'" where id='+lastMessageId+''; 
                            //console.log("\n"+updateSocketIdSql+"\n");
                            var query = db.query(updateSocketIdSql, function(err, result) {
                                //if (err) throw err;   
                                if (err) console.log("Err-> "+err.sql);     
                            });    
                        });   
                    }
                 }
             }
                    
                if((sendFirebaseNotification==1)&&(message!=''))
                {
                    if(isNotification==1)
                    {
                        //Android 
                        if(receiverDeviceType==1)
                        {
                            sendAndroidNotify(receiverDeviceToken,message,to_id,receiverUserName);    
                        }
                        
                        //ios
                        if(receiverDeviceType==2)
                        {
                            sendIosNotify(receiverDeviceToken,message,to_id,receiverUserName);    
                        }
                    }
                    
                }
                    
          });

    });
    
    /*---------------------------------- Get List Function Start ---------------------------------*/
        socket.on('getList', function (arr) {
            var from_id = arr['sender'];
             //console.log('GetListId-> '+from_id+"\n");
            
             axios
              .post('http://3.143.123.23/api/get-chat-list', {
                 user_id:from_id
              })
              .then(res => {
                 //console.log(res.data)
                if(res.data.status==true){
                    //console.log("GL=> "+res.data);
                    io.to(socketId).emit('getList', res.data);
                }else{
                    io.to(socketId).emit('getList', "error");
                }
                //console.log(`statusCode: ${res.data.status}`);
                
              })
              .catch(error => {
                 io.to(socketId).emit('getList', "catch error");
              });
        });
    /*---------------------------------- Get List Function End ---------------------------------*/

    socket.on('disconnect', (socket) => {
        //console.log('Connect Disconnect successfully ');
    });   
});

httpServer.listen(process.env.NODE_PORT, function () {
    console.log('Server listening on Port', process.env.NODE_PORT);
});
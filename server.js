var express=require('express')
var app=express()
var http=require('http').createServer(app)

var mongodb=require("mongodb")
var mongoClient=mongodb.MongoClient
var ObjectId=mongodb.ObjectId
var bodyParser=require("body-parser")
var bcrypt=require("bcrypt")
var  formidable=require('formidable')
var fileSystem=require("fs")
var { getVideoDurationInSeconds}=require("get-video-duration")

var expressSession=require('express-session')
const { request } = require('http')
app.use(expressSession({
    "key":"user_id",
    "secret":"User secret Object ID",
    "resave":true,
    "saveUninitialized":true
}))
//a function to return user's document
function getUser(id,callBack){
    database.collection("users").findOne({
        "_id":mongodb.ObjectID(id)
    },function(error,user){
        callBack(user)
    })
}

app.use(bodyParser.json({
    limit:"10000mb"
}))
app.use(bodyParser.urlencoded({
    extended:true,
    limit:"1000mb",
    parameterLimit:10000
}))
app.use("/public",express.static(__dirname+"/public"))
app.set("view engine","ejs")

http.listen(3000,function(){
    console.log('Server Started')

    mongoClient.connect("mongodb://localhost:27017",function(error,client){
    database=client.db("my_video_streaming")

    app.get("/",function(req,res){
        res.render("home")
        
    })
 
    app.get("/allvideos",function(req,res){
        database.collection("videos").find({}).sort({
            "createdAt":-1
        }).toArray(function(error,videos){
            res.render("allvideos",{
                "isLogin":false,
                "id":req.session.user_id,
                "videos":videos
            })
        })  
        
    })
    app.get("/allcreators",function(req,res){
     let coll=database.collection("users")
     var x=0
     coll.count().then((count) => {
        x=count
        console.log(x)
    });
        database.collection("users").find({}).toArray(function(error,users){
            res.render("allcreators",{
                "users":users,
                "count":x
            })
        })
    })
    app.get('/glider.min.js',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/glider.min.js')
     })
     app.get('/css/glider.min.css',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/css/glider.min.css')
     })
     app.get('/css/main.css',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/css/main.css')
     })
     app.get('/watch/css/glider.min.css',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/css/main.css')
     })
     app.get('/watch/glider.min.js',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/glider.min.js')
     })
     app.get('/watch/css/main.css',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/css/main.css')
     })
     app.get('/watch/css/main.css.map',(req,res)=>{
        res.sendFile('C:/Users/VAIBHAV/Documents/All NodeFiles/Projects/Video-Streaming/views/css/main.css.map')
     })
    app.get("/loggedin",function(req,res){
        database.collection("videos").find({}).sort({
            "createdAt":-1
        }).toArray(function(error,videos){
            res.render("index",{
                "isLogin":req.session.user_id?true:false,
                "videos":videos,
                "id":req.session.user_id
            })
        })
        
      
    })

    app.get("/signup",function(req,res){
        res.render("signup")
    })
    app.post("/signup",function(req,res){
        //Check if Email already exists
        database.collection("users").findOne({
            "email":req.body.email
        },function(error,user){
            if(user==null)
            {
                //not exists

                //convert password to hash
                bcrypt.hash(req.body.password,10,function(error,hash){
                    database.collection("users").insertOne({
                        "name":req.body.name,
                        "email":req.body.email,
                        "password":hash,
                        "coverPhoto":"",
                        "image":"",
                        "subscribers":0,
                        "subscriptions":[],//channels I have subscribed,
                        "playlists":[],
                        "videos":[],
                        "history":[],
                        "notifications":[]
                    },function(error,data){
                        res.redirect("/login")
                    })
                    })
            }
            else{
                //exists
                res.send("Email already exists!!")
            }
        })
    })
    app.get("/login",function(req,res){
        res.render("login",{
            "error":"",
            "message":""
        })
    })
    app.post("/login",function(req,res){
        // check if email exists
        database.collection("users").findOne({
            "email":req.body.email,
        },function(error,user){
            if(user==null){
                res.send("Email does not exists")
            }else{
                //compare hashed password
                bcrypt.compare(req.body.password,user.password,function(error,isVerify){
                    if(isVerify){
                        //save user ID in session
                        req.session.user_id=user._id
                        res.redirect("/loggedin")
                    }else{
                        res.send("Password is not correct")
                    }
                })
            }
        })
    })
    app.get("/logout",function(req,res){
        req.session.destroy()
        res.redirect("/")
    })
    app.get("/upload",function(req,res){
        if(req.session.user_id){
            //create new page for upload
            res.render("upload",{
                "isLogin":true
            })
        }else{
            res.redirect("/login")
        }
    })
    app.post("/upload-video",function(req,res){
        // check if user is logged in 
        if(req.session.user_id){
           var formData=new formidable.IncomingForm()
           formData.maxFileSize=1000*1024*1024
           formData.parse(req,function(err,fields,files){
               var title=fields.title
               var description=fields.description
               var tags=fields.tags
               var category=fields.category

               var oldPathThumbnail=files.thumbnail.path
               var thumbnail="public/thumbnails/" + new Date().getTime()+ "-"+ files.thumbnail.name

               fileSystem.rename(oldPathThumbnail,thumbnail,function(error){

               })
               console.log(oldPathVideo)
               console.log(newPath)
               var oldPathVideo=files.video.path
               var newPath="public/videos" + new Date().getTime()+"-"+files.video.name

               fileSystem.rename(oldPathVideo,newPath,function(error){
                   //get user data to save in videos document
                   getUser(req.session.user_id,function(user){
                       var currentTime=new Date().getTime()
                       //get video duration
                       getVideoDurationInSeconds(newPath).then(function(duration){
                           var hours=Math.floor(duration/60/60)
                           var minutes=Math.floor(duration/60)-(hours*60)
                           var seconds=Math.floor(duration%60)

                           //insert in database

                           database.collection("videos").insertOne({
                               "user":{
                                   "_id":user._id,
                                   "name":user.name,
                                   "image":user.image,
                                   "subscribers":user.subscribers
                               },
                              "filePath":newPath,
                              "thumbnail":thumbnail,
                              "title":title,
                              "description":description,
                              "tags":tags,
                              "category":category,
                              "createdAt":currentTime,
                              "minutes":minutes,
                              "seconds":seconds,
                              "hours":hours,
                              "watch":currentTime,
                               "views":0,
                               "playlist":"",
                               "likers":[],
                               "dislikers":[],
                               "comments":[]
                           },function(error,data){
                               //insert in users collection too
                               database.collection("users").updateOne({
                                   "_id":ObjectId(req.session.user_id)
                               },{
                                   $push:{
                                       "videos":{
                                           "_id":data.insertId,
                                           "title":title,
                                           "views":0,
                                           "thumbnail":thumbnail,
                                           "watch":currentTime
                                       }
                                   }
                               })
                               res.redirect('/loggedin')
                           })
                       })
                   })
               })
           }) 
        }else{
            res.redirect("/login")
        }
    })
        app.get("/watch/:name",function(req,res){
          
           
                    //increment views counter 
                    // database.collection("users").updateOne({
                    //     "_id":ObjectId(video._id)
                    // },{
                    //     $inc:{
                    //         "views":1
                    //     }
                    // })
                    database.collection("videos").find({}).sort({
                        "createdAt":-1
                    }).toArray(function(error,videos){
                        res.render("playvideo",{
                            //"isLogin":req.session.user_id?true:false,
                            "videos":videos,
                            "name":req.params.name
                        })
                    })
               
        })
        app.post("/do-like",function(req,res){
            console.log(req.session.user_id)
            if(req.session.user_id){
                //check if already liked
                
                database.collection("videos").findOne({
                    $and:[{
                    "_id":ObjectId(req.body.videoId)},{
                    "likers._id":req.session.user_id
                    }]
                    
                },function(error,video){
                    if(video==null){
                        //push in likers array
                        database.collection("videos").updateOne({
                            "_id":ObjectId(req.body.videoId)    
                        },{
                          
                            $push:{
                                "likers":{
                                    "_id":req.session.user_id
                                }
                            }
                        },function(error,data){
                            res.json({
                                "status":"success",
                                "message":"Video has been liked"
                            })
                        })
                    }else{
                        res.json({
                            "status":"error",
                            "message":"Already liked this video"
                        })
                    }
                })
            }else{
                res.json({
                    "status":"error",
                    "message":"Please login"
                })
               // res.redirect("/login")
            }
        })
        app.post("/do-subscribe",function(req,res){
            if(req.session.user_id){
                database.collection("videos").findOne({
                    "_id":ObjectId(req.body.videoId)
                },function(error1,video){
                    if(req.session.user_id==video.user._id){
                        result.json({
                            "status":"error",
                            "message":"You cannot subscribe on your own channel"
                        });
                    }else{
                        //check if channel is already subscribed
                        getUser(req.session.user._id,function(myData){
                            var flag=flase;
                            for(var a=0;a<myData.subscriptions.length;a++){
                                if(myData.subscriptions[a]._id.toString()==video.user._id.toString()){
                                    flag=true;
                                    break;
                                }
                            }
                            if(flag){
                                result.json({
                                    "status":"error",
                                    "message":"Already subscribed"
                                })
                            }else{
                                database.collection("users").findOneAndUpdate({
                                    "_id":video.user._id
                                },{
                                    $inc:{
                                        "subscribers":1
                                    }
                                },{
                                    returnOriginal:false
                                },function(error2,userData){
                                    database.collection("users").updateOne({
                                        "_id":ObjectId(req.session.user._id)
                                },{
                                    $push:{
                                        "subscriptions":{
                                            "_id":video.user._id,
                                            "name":video.user.name,
                                            "subscribers":userData.value.subscribers,
                                            "image":userData.value.image
                                        }
                                    }
                                },function(error3,data){
                                    database.collection("videos").findOneAndUpdate({
                                        "_id":ObjedctId(req.body.videoId)
                                    },{
                                        $inc:{
                                            "user.subscribers":1
                                        }
                                    })
                                    result.json({
                                        "status":"success",
                                        "message":"Subscription has been added"
                                    })
                                    
                                })
                        })
                    }
                })
            }
        })
    }else{
       result.json({
           "status":"error",
           "message":"Please login to perform this action"
       }) 
    }
   
})



    })
})
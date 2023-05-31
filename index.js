const mongo = require("mongodb");
const uri = "mongodb+srv://root:root123@cluster0.qakwd4l.mongodb.net/?retryWrites=true&w=majority"
const client =new mongo.MongoClient(uri,{useNewUrlParser:true,useUnifiedTopology:true});
let db = null;
async function initDB(){
    await client.connect(async function(err){
        if(err){
            console.log("資料庫連線失敗", err)
            return;
        }
    }); 
    db = client.db("member-message");
    
    console.log("連線成功");
}
initDB();

const express = require("express");
const app = express();
const session = require("express-session");
app.use(session({
    secret:"anything",
    resave:false,
    saveUninitialized:true
}));
app.set("view engin","ejs");
app.set("views","./views");
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
//登入畫面
app.get("/" , function(req,res){
    res.render("signin.ejs");
})
app.get("/signup", function(req, res){
    res.render("signup.ejs")
})
app.get("/message",async function(req,res){
    if(!req.session.user){
        res.redirect("/");
        return;
    }
    const collection = db.collection("message");
    const result =await collection.find({});
    let data = [];
    await result.forEach(function(message){
        data.push(message);
    });
    res.render("home.ejs",{data:data});
})
app.get("/error", function(req,res){
    const msg = req.query.msg;
    res.render("error.ejs",{msg:msg});
});



app.post("/signupTurn",async function(req, res){
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const collection = db.collection("user")
    let result =await collection.findOne({
        email:email
    });
    if(result !== null){
        res.redirect("/error?msg=信箱重複");
        return;
    }
    result =await collection.findOne({
        name:name
    });
    if(result !== null){
        res.redirect("/error?msg=信箱重複");
        return;
    }

    result =await collection.insertOne({
        name:name,
        email:email,
        password:password
    });
    res.redirect("/")
})
app.post("/signinTurn",async function(req, res){
    const email = req.body.email;
    const password = req.body.password;
    const collection = db.collection("user");
    let result =await collection.findOne({
        $and:[
            {email:email},
            {password:password}
        ]
    });
    if(result === null){
        res.redirect("/error?msg=帳號密碼錯誤。");
        return;
    }
    req.session.user = result;
    res.redirect("message");
})

app.get("/update",async function(req,res){
    const name = req.session.user.name;
    const message = req.query.message;
    const collection = db.collection("message");
    if (message === ""){
        res.redirect("/error?msg=請輸入文字");
        return;
    }

    await collection.insertOne({
        name:name,
        message:message
    });
    res.redirect("/message")
})

app.listen(3000,function(){
    console.log("Server Started")
})
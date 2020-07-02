var express = require('express')
var router = express.Router()
var User = require('../models/user')
//var Content = require('../models/listModel')
var Ex = require('../models/ex')
var path = require('path')
const { FileSystemWallet, Gateway } = require('fabric-network');
const fs = require('fs');
const ccpPath = path.resolve(__dirname, '..', '..', 'network' ,'connection.json');
console.log(ccpPath)
const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
const ccp = JSON.parse(ccpJSON);

// Authentication Middleware
const loggedInOnly = (req, res, next) => {
    if (req.isAuthenticated()) next();
    else res.redirect("/login");
  };
  
  const loggedOutOnly = (req, res, next) => {
    if (req.isUnauthenticated()) next();
    else res.redirect("/");
  };

// Route Handlers
function authenticate(passport) {

    //템플릿용 변수 설정
router.use(function(req,res,next){
    res.locals.currentUser = req.user;
    console.log(res.locals.currentUser)
    res.locals.errors = req.flash("error");
    res.locals.infos = req.flash("info");
    next();
  });
// // index Page
router.get("/",loggedInOnly, (req, res) => {
    //console.log(req.user.username)
    User.find((err, result)=>{
      if(err) {
        console.log(err)
      }
        console.log(result[0])
        res.render("index" , {data:result[0].username});
    })
   
  });
// Main Page
router.get("/main", loggedInOnly, async(req, res) => {
    console.log(req.user.username)
    res.render("main", { username: req.user.username });
  });
router.post('/main' ,loggedInOnly, async function(req, res){  
  try{
    var name = new Ex()
    name = req.body.ex

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('hdat');
    await contract.submitTransaction('createHDat', req.user.username, name);
    console.log('Transaction has been submitted');
    await gateway.disconnect();
  }catch(error)
  {
    
  }

   res.status(200).send('Transaction has been submitted'); 
})
router.get('/output' ,loggedInOnly, async function(req, res){  
  
  const name = req.query.ex;
        
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = new FileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);
    const userExists = await wallet.exists('user1');
    if (!userExists) {
        console.log('An identity for the user "user1" does not exist in the wallet');
        console.log('Run the registerUser.js application before retrying');
        return;
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('hdat');
    const result = await contract.evaluateTransaction('queryAllHDat', req.user.username);
    console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    var obj = JSON.parse(result);
    res.render('output', {result:obj})
    //res.status(200).json(obj); 
})
router.get('/data' , loggedInOnly, function(req,res){
    // console.log(req)

    res.json({"address":"서울시 마포구 백범로 18"})
})  

// Login View
  router.get("/login", loggedOutOnly, (req, res) => {
    res.render("login");
  });

  // Login Handler
  router.post(
    "/login",
    passport.authenticate("local", {
      successRedirect: "/main",
      failureRedirect: "/login",
      failureFlash: true
    })
  );

router.get('/signup',loggedOutOnly, function(req, res){
    res.render('signup', {message:"true"})
})

router.post("/signup",function(req,res,next){
    var username = req.body.username;
     var email =  req.body.email
    var password = req.body.password;
    User.findOne({username:username},function(err,user){
      if(err){return next(err);}
      if(user){
        req.flash("error","사용자가 이미 있습니다.");
        return res.render("signup" , {message:"false"});
      }
      User.create({ username,email, password })
      .then(user => {
        req.login(user, err => {
          if (err) next(err);
          else res.redirect("/main");
        });
      })
      .catch(err => {
        if (err.name === "ValidationError") {
          req.flash("Sorry, that username is already taken.");
          res.redirect("/signup");
        } else next(err);
      });
    });
  });

// Logout Handler
router.all("/logout", function(req, res) {
    req.logout();
    res.redirect("/login");
  });


// Error Handler
router.use((err, req, res) => {
    console.error(err.stack);
    // res.status(500).end(err.stack);
  });

return router;
}
module.exports = authenticate;
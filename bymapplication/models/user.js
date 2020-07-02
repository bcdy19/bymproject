var mongoose = require('mongoose')
var bcrypt = require("bcryptjs");
const uniqueValidator = require("mongoose-unique-validator");

var UserSchema = mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    passwordHash:{
        type:String,
        required:true
    },
    email:String,
    createAt:{
        type:Date,
        default:Date.now
    },
    diplayName: String,
    bio: String
})

UserSchema.plugin(uniqueValidator);

UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.passwordHash);
};


// UserSchema.pre('save', function (value){
    
//       return this.passwordHash = bcrypt.hashSync(value);
      
//  } );
  
UserSchema.virtual("password").set(function(value) {
  this.passwordHash = bcrypt.hashSync(value, 12);
});
// //모델에 간단한 메서드 추가
// userSchema.methods.name = function(){
//     return this.displayName || this.username;
//   };
//   //bcrypt를 위한 빈 함수
//   var noop = function(){};
//   //모델이 저장되기("save") 전(.pre)에 실행되는 함수
//   userSchema.pre("save",function(done){
//     var user = this;
//     if(!user.isModified("password")){
//       return done();
//     }
//     bcrypt.genSalt(SALT_FACTOR,function(err,salt){
//       if(err){return done(err);}
//       bcrypt.hash(user.password,salt,noop,function(err,hashedPassword){
//         if(err){return done(err);}
//         user.password = hashedPassword;
//         done();
//       });
//     });
//   });
//   // 비밀번호 검사하는 함수
//   userSchema.methods.checkPassword = function(guess,done){
//     bcrypt.compare(guess,this.password,function(err,isMatch){
//         done(err,isMatch);
//     });
//   };
//   //실제로 사용자 모델만들고 내보내기
var User = mongoose.model("User" , UserSchema)
module.exports = User;
var mongoose = require('mongoose')
var exSchema = mongoose.Schema({
    ex:{
        type:Number
    },
    createAt:{
        type:Date,
        default:Date.now
    }
});
var Ex = mongoose.model("Ex" , exSchema);
module.exports = Ex;
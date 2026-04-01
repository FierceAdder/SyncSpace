const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Email : String, 
    Password : String,
    Groups_Created: [{type : mongoose.Schema.Types.ObjectId, ref : 'Group',default : []}],
    Groups_Part_Of : [{type : mongoose.Schema.Types.ObjectId, ref : 'Group',default : []}],
    UserName : String
});

const User = mongoose.model('User', userSchema);
module.exports = User;
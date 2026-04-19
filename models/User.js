const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Email : String, 
    Password : String,
    Groups_Created: [{type : mongoose.Schema.Types.ObjectId, ref : 'Group',default : []}],
    Groups_Part_Of : [{type : mongoose.Schema.Types.ObjectId, ref : 'Group',default : []}],
    UserName : String,
    Avatar_Url : { type: String, default: '' },
    About : { type: String, maxlength: 250, default: '' },
    Joined_At : { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
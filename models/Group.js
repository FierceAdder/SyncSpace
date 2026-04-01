const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    Group_Owner_Id : {type : mongoose.Schema.Types.ObjectId,ref : 'User'},
    Group_Name : String,
    Members : [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default : [] }],
    Join_Code : String
});

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    Group_Posted_In : {type : mongoose.Schema.Types.ObjectId,ref : 'Group'},
    Resource_Type : String,
    Content : String,
    Name : String,
    Description : { type: String, maxlength: 100, default: '' },
    Category : String,
    Thumbnail_url : String,
    Original_title : String,
    Upvotes : [{type : mongoose.Schema.Types.ObjectId,ref : 'User',default : []}],
    Downvotes : [{type : mongoose.Schema.Types.ObjectId,ref : 'User',default : []}],
    Posted_By : {type : mongoose.Schema.Types.ObjectId,ref : 'User'}
});
 
const Resource = mongoose.model('Resources', ResourceSchema);
module.exports = Resource;
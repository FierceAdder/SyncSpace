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
    Posted_By : {type : mongoose.Schema.Types.ObjectId,ref : 'User'},
    // File upload fields (S3)
    File_Key : String,
    File_Size : Number,
    File_Name : String,
    // Article/blog authoring
    Article_Body : String
}, { timestamps: true });

// Text index for fast search
ResourceSchema.index({
    Name: 'text',
    Content: 'text',
    Category: 'text',
    Description: 'text',
    Article_Body: 'text'
});

const Resource = mongoose.model('Resources', ResourceSchema);
module.exports = Resource;
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    Resource_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resources', index: true },
    Author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    Content: { type: String, maxlength: 500, required: true }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;

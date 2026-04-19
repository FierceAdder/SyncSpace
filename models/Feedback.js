const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    User_Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    Type: { type: String, enum: ['feature_request', 'bug_report'], required: true },
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Status: { type: String, default: 'open', enum: ['open', 'in_progress', 'resolved', 'closed'] }
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;

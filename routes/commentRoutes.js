const express = require("express");
const verifyToken = require("../middleware/auth");
const Comment = require("../models/Comment");

const router = express.Router();

// Get comments for a resource (initial load)
router.get('/:resourceId', verifyToken, async (req, res) => {
    try {
        const comments = await Comment.find({ Resource_Id: req.params.resourceId })
            .populate('Author', 'UserName Avatar_Url')
            .sort({ createdAt: 1 });
        res.status(200).json({ comments });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

// Add a comment
router.post('/:resourceId', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Comment content is required." });
        }

        const comment = new Comment({
            Resource_Id: req.params.resourceId,
            Author: req.user.id,
            Content: content.trim().slice(0, 500)
        });
        await comment.save();

        // Populate author info before returning
        const populated = await Comment.findById(comment._id)
            .populate('Author', 'UserName Avatar_Url');

        // Emit via socket.io if available
        const io = req.app.get('io');
        if (io) {
            io.to(`resource:${req.params.resourceId}`).emit('new_comment', populated);
        }

        res.status(201).json({ comment: populated });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

// Delete own comment
router.delete('/:commentId', verifyToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found." });
        }
        if (comment.Author.toString() !== req.user.id) {
            return res.status(403).json({ message: "You can only delete your own comments." });
        }

        const resourceId = comment.Resource_Id.toString();
        await comment.deleteOne();

        // Emit via socket.io if available
        const io = req.app.get('io');
        if (io) {
            io.to(`resource:${resourceId}`).emit('delete_comment', { commentId: req.params.commentId });
        }

        res.status(200).json({ message: "Comment deleted." });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

module.exports = router;

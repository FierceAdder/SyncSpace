const express = require("express");
const verifyToken = require("../middleware/auth");
const Feedback = require("../models/Feedback");

const router = express.Router();

// Submit feedback (feature request or bug report)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { Type, Title, Description } = req.body;

        if (!Type || !Title || !Description) {
            return res.status(400).json({ message: "Type, Title, and Description are required." });
        }

        if (!['feature_request', 'bug_report'].includes(Type)) {
            return res.status(400).json({ message: "Type must be 'feature_request' or 'bug_report'." });
        }

        const feedback = new Feedback({
            User_Id: req.user.id,
            Type,
            Title: Title.trim(),
            Description: Description.trim()
        });
        await feedback.save();

        res.status(201).json({ message: "Feedback submitted successfully.", feedback });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

// List user's own feedback
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const feedback = await Feedback.find({ User_Id: req.user.id })
            .sort({ createdAt: -1 });
        res.status(200).json({ feedback });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

module.exports = router;

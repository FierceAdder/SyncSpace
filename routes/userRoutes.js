const express = require("express");
const User = require("../models/User");
const Resource = require("../models/Resources");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const router = express.Router();
const jwtSecret = process.env.JWT_SECRET;
const verifyToken = require('../middleware/auth');
const { generatePresignedUploadUrl } = require('../utils/s3');

// Multer for avatar upload (memory storage, then push to S3)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

router.post('/register', async (req, res) => {
    const details = req.body;
    try {
        if (await User.exists({ Email: details.Email })) {
            return res.status(400).json({
                "message": "An account with this email already exists."
            });
        }
        const salt = await bcrypt.genSalt(11);
        details.Password = await bcrypt.hash(details.Password, salt);
        const newUser = new User({
            Email: details.Email,
            Password: details.Password,
            UserName: details.UserName
        })
        await newUser.save()

        res.status(201).json({
            message: 'User registered successfully',
            data: {
                "Email": details.Email,
                "UserName": details.UserName
            }
        });

    } catch (error) {

        res.status(400).json({
            message: 'Invalid Request! Try again later',
            data: details
        });

    }
});

router.post('/login', async (req, res) => {
    try {
        const details = req.body;
        const recievedEmail = details.Email;
        const recievedPassword = details.Password;
        const user = await User.findOne({ Email: recievedEmail });
        if (!user) {
            res.status(400).json({
                "message": "Invalid E-mail/Password, Try Again"
            });
        } else {
            const hashedPassword = user.Password;
            const valid = await bcrypt.compare(recievedPassword, hashedPassword);
            if (!valid) {
                res.status(400).json({
                    "message": "Invalid E-mail/Password, Try Again"
                });
            } else {
                const token = await jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '2h' });
                res.status(200).json({
                    "message": "Login Successful!!!",
                    "token": token
                });
            }
        }
    } catch (err) {
        console.log("Login Failed, \nError : ", err);
        res.status(500).json({
            "message": "Something's wrong on our end, please try again later."
        })
    }

});

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                "message": "User Not Found."
            });
        }

        // Count resources contributed by this user
        const resourceCount = await Resource.countDocuments({ Posted_By: userId });

        // Count total upvotes received on user's resources
        const userResources = await Resource.find({ Posted_By: userId }, 'Upvotes');
        const totalUpvotes = userResources.reduce((sum, r) => sum + (r.Upvotes?.length || 0), 0);

        const profile = {
            "_id": user._id.toString(),
            "Username": user.UserName,
            "Groups_Owned": user.Groups_Created.length,
            "Groups_Part_Of": user.Groups_Part_Of.length,
            "Email": user.Email,
            "Avatar_Url": user.Avatar_Url || '',
            "About": user.About || '',
            "Joined_At": user.Joined_At || user._id.getTimestamp(),
            "Resources_Count": resourceCount,
            "Total_Upvotes": totalUpvotes
        };
        return res.status(200).json({
            "message": "Profile found.",
            "Profile": profile
        });

    } catch (err) {
        console.log("Profile fetch failed, \nError : ", err);
        res.status(500).json({
            "message": "Something's wrong on our end, please try again later."
        })
    }
});

// Get detailed group info (for interactive dashboard stats)
router.get('/groups-detail', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId)
            .populate('Groups_Part_Of', 'Group_Name')
            .populate('Groups_Created', 'Group_Name');

        if (!user) {
            return res.status(404).json({ message: "User Not Found." });
        }

        res.status(200).json({
            groups_joined: user.Groups_Part_Of.map(g => ({ _id: g._id, name: g.Group_Name })),
            groups_owned: user.Groups_Created.map(g => ({ _id: g._id, name: g.Group_Name }))
        });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.put('/update-username', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const newUsername = req.body.newUsername;
        const newUser = await User.findByIdAndUpdate(userId, { "$set": { "UserName": newUsername } }, { new: true })
        if (newUser) {
            return res.status(200).json({
                "message": "Username changed successully.",
                "newUsername": newUsername
            });
        } else {
            return res.status(404).json({
                "message": "User Not Found."
            });
        }
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({
            "message": "Something's wrong on our end, please try again later."
        })
    }

});

router.put('/update-password', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const oldPassword = req.body.oldPassword;
        const newPassword = req.body.newPassword;
        const user = await User.findById(userId);
        const validOldPassword = await bcrypt.compare(oldPassword, user.Password);
        if (validOldPassword) {
            const salt = await bcrypt.genSalt(11);
            user.Password = await bcrypt.hash(newPassword, salt);
            await user.save();
            return res.status(200).json({
                "message": "Password Changed successfully."
            });
        } else {
            return res.status(403).json({
                "message": "Incorrect current password change denied."
            });
        }

    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({
            "message": "Something's wrong on our end, please try again later."
        })
    }

});

// Update profile bio (About)
router.put('/update-profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { About } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { About: (About || '').slice(0, 250) },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User Not Found." });
        }

        res.status(200).json({
            message: "Profile updated.",
            About: user.About
        });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

// Get presigned URL for avatar upload, then update user record
router.put('/update-avatar', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { fileName, contentType } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({ message: "fileName and contentType are required." });
        }

        const key = `avatars/${userId}/${Date.now()}-${fileName}`;
        const uploadUrl = await generatePresignedUploadUrl(key, contentType);

        // We'll save the key now; the frontend will upload directly to S3
        // then the avatar URL will be the S3 object URL
        const avatarUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

        await User.findByIdAndUpdate(userId, { Avatar_Url: avatarUrl });

        res.status(200).json({
            message: "Upload URL generated.",
            uploadUrl,
            avatarUrl,
            key
        });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});


module.exports = router;
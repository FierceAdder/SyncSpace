const verifyToken = require("../middleware/auth");
const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const Group = require("../models/Group");
const Resource = require("../models/Resources");

const router = express.Router();

const generateJoinCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint8Array(6);
    crypto.getRandomValues(randomValues);
    randomValues.forEach(value => {
        result += chars[value % chars.length];
    });
    return result;
};

router.post("/create", verifyToken, async (req, res) => {
    try {
        const details = req.body;
        const group = new Group({
            Group_Owner_Id: req.user.id,
            Group_Name: details.Group_Name,
            Description: (details.Description || '').slice(0, 100),
            Members: [req.user.id],
            Join_Code: generateJoinCode()
        });
        await group.save();
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { Groups_Created: group._id, Groups_Part_Of: group._id } }
        );
        res.status(201).json({ message: "Group Created successfully" });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.post("/join", verifyToken, async (req, res) => {
    try {
        const recievedJoinCode = req.body.Join_Code;
        const group = await Group.findOne({ Join_Code: recievedJoinCode });
        if (!group) {
            return res.status(400).json({ message: "Invalid Join Code, Group not found" });
        }
        const groupId = group._id;
        await Group.findByIdAndUpdate(groupId, { $addToSet: { Members: req.user.id } });
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { Groups_Part_Of: groupId } });
        res.status(200).json({ message: "Joined group succesfully." });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.put("/:groupId/update", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.groupId;
        const { Group_Name, Description } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found." });
        if (group.Group_Owner_Id.toString() !== userId)
            return res.status(403).json({ message: "Only the owner can edit this group." });

        if (Group_Name && Group_Name.trim()) group.Group_Name = Group_Name.trim();
        if (Description !== undefined) group.Description = Description.slice(0, 100);

        await group.save();
        res.status(200).json({ message: "Group updated successfully.", group: { Group_Name: group.Group_Name, Description: group.Description } });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.delete("/:groupId/delete", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.groupId;
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not Found." });
        }
        if (group.Group_Owner_Id.toString() === userId) {
            await Resource.deleteMany({ Group_Posted_In: groupId });
            await User.updateMany(
                { Groups_Part_Of: groupId },
                { $pull: { Groups_Part_Of: groupId, Groups_Created: groupId } }
            );
            await group.deleteOne();
            return res.status(200).json({ message: "Group deleted successfully" });
        } else {
            return res.status(403).json({ message: "Unauthorized" });
        }
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.put("/:groupId/leave", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.groupId;
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not Found." });
        }
        if (userId === group.Group_Owner_Id.toString()) {
            return res.status(405).json({ message: "Group Owner can't abandon the group. Try deleting." });
        }
        await Group.findByIdAndUpdate(groupId, { $pull: { Members: req.user.id } });
        await User.findByIdAndUpdate(userId, { $pull: { Groups_Part_Of: groupId } });
        return res.status(200).json({ message: "Group Left successfully." });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.get("/mine", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const groups = await Group.find(
            { _id: { $in: user.Groups_Part_Of } },
            { Join_Code: 1, Group_Name: 1, Description: 1, Group_Owner_Id: 1, Members: 1 }
        ).populate("Group_Owner_Id", "UserName");

        const result = groups.map(g => ({
            _id: g._id,
            Group_Name: g.Group_Name,
            Description: g.Description || '',
            Join_Code: g.Join_Code,
            Owner: {
                _id: g.Group_Owner_Id?._id,
                UserName: g.Group_Owner_Id?.UserName
            },
            isOwner: g.Group_Owner_Id?._id?.toString() === userId,
            memberCount: g.Members.length
        }));

        res.status(200).json({ groups: result });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.get("/:groupId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.groupId;

        const group = await Group.findById(groupId)
            .populate("Group_Owner_Id", "UserName");

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        const isMember = group.Members.some(m => m.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group." });
        }

        res.status(200).json({
            group: {
                _id: group._id,
                Group_Name: group.Group_Name,
                Description: group.Description || '',
                Join_Code: group.Join_Code,
                Owner: {
                    _id: group.Group_Owner_Id?._id,
                    UserName: group.Group_Owner_Id?.UserName
                },
                isOwner: group.Group_Owner_Id?._id?.toString() === userId,
                memberCount: group.Members.length
            }
        });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.get("/:groupId/members", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.groupId;

        const group = await Group.findById(groupId)
            .populate("Members", "UserName Email");

        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        const isMember = group.Members.some(m => m._id.toString() === userId);
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group." });
        }

        const members = group.Members.map(m => ({
            _id: m._id,
            UserName: m.UserName,
            Email: m.Email,
            isOwner: m._id.toString() === group.Group_Owner_Id.toString()
        }));

        res.status(200).json({ members });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.delete("/:groupId/members/:memberId", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { groupId, memberId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (group.Group_Owner_Id.toString() !== userId) {
            return res.status(403).json({ message: "Only the group owner can remove members." });
        }

        if (memberId === userId) {
            return res.status(400).json({ message: "Owner cannot remove themselves. Delete the group instead." });
        }

        const wasMember = group.Members.some(m => m.toString() === memberId);
        if (!wasMember) {
            return res.status(404).json({ message: "User is not a member of this group." });
        }

        await Group.findByIdAndUpdate(groupId, { $pull: { Members: memberId } });
        await User.findByIdAndUpdate(memberId, { $pull: { Groups_Part_Of: groupId } });

        res.status(200).json({ message: "Member removed successfully." });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.put("/:groupId/regenerate-code", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.groupId;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found." });
        }

        if (group.Group_Owner_Id.toString() !== userId) {
            return res.status(403).json({ message: "Only the group owner can regenerate the join code." });
        }

        const newCode = generateJoinCode();
        group.Join_Code = newCode;
        await group.save();

        res.status(200).json({ message: "Join code regenerated.", Join_Code: newCode });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

module.exports = router;
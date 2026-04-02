const express=require("express");
const verifyToken=require("../middleware/auth");
const Resource=require("../models/Resources");
const User = require("../models/User");
const Group = require("../models/Group");

const router=express.Router();

router.post('/add',verifyToken,async (req,res)=>{
    try{
        const details=req.body;
        const userId=req.user.id;
        const groupToPost=details.groupToPost;
        const isMember=(await User.exists({_id : userId,Groups_Part_Of : groupToPost}));
        if(isMember){
            const newResource=new Resource({
                Group_Posted_In : groupToPost,
                Resource_Type : details.Resource_Type,
                Content : details.Content,
                Name : details.Name,
                Category : details.Category,
                Posted_By : userId
            });
            await newResource.save();
            res.status(201).json({
                "message" : "Resource added successfully"
            })
        }else{
            res.status(403).json({
                "message" : "You are not a member of this group."
            })
        }
    }catch(err){
        console.log("Error : ",err);
        res.status(500).json({
            "message" : "Error Occured"
        })
    }
});

router.get("/:groupId",verifyToken,async (req,res)=>{
    try{
        const groupId=req.params.groupId;
        const userId=req.user.id;
        const isMember=(await User.exists({_id : userId,Groups_Part_Of : groupId}));
        if(isMember){
            const resources = await Resource.find({ Group_Posted_In: groupId }).populate('Posted_By', 'UserName');
            res.status(200).json({
                resources
            });
        }else{
            res.status(403).json({
                "message" : "You are not a member of this group."
            })
        }
    }catch(err){
        console.log("Error : ",err);
        res.status(500).json({
            "message" : "Error Occured"
        })
    }
});

router.put("/:resourceId/upvote", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const resourceId = req.params.resourceId;
        const resource = await Resource.findById(resourceId);
        
        if (!resource) {
            return res.status(404).json({ message: "Resource Not Found." }); 
        }
        
        if (resource.Upvotes.some(id => id.toString() === userId)) {
            resource.Upvotes.pull(userId);
            await resource.save();
            res.status(200).json({ message: "Upvote removed!" }); 
        } else {
            if (resource.Downvotes.some(id => id.toString() === userId)) {
                resource.Downvotes.pull(userId);
            }
            resource.Upvotes.push(userId);
            await resource.save();
            res.status(200).json({ message: "Upvote added!" }); 
        }
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.put("/:resourceId/downvote", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const resourceId = req.params.resourceId;
        const resource = await Resource.findById(resourceId);
        
        if (!resource) {
            return res.status(404).json({ message: "Resource Not Found." }); 
        }
        
        if (resource.Downvotes.some(id => id.toString() === userId)) {
            resource.Downvotes.pull(userId);
            await resource.save();
            res.status(200).json({ message: "Downvote removed!" }); 
        } else {
            if (resource.Upvotes.some(id => id.toString() === userId)) {
                resource.Upvotes.pull(userId);
            }
            resource.Downvotes.push(userId);
            await resource.save();
            res.status(200).json({ message: "Downvote added!" });
        }
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.delete("/:resourceId",verifyToken,async (req,res)=>{
    try{
        const userId=req.user.id;
        const resourceId=req.params.resourceId;
        const resource = await Resource.findById(resourceId);
        if(!resource){
            return res.status(404).json({ message: "Resource Not Found." }); 
        }
        const resourceOwner = resource.Posted_By.toString();
        const group = (await Group.findById(resource.Group_Posted_In));
        if(userId===resourceOwner || (group && userId===group.Group_Owner_Id.toString())){
            await resource.deleteOne()
            res.status(200).json({
                "message" : "Deleted resource successfully."
            });
        }else{
            res.status(403).json({
                "message" : "Unauthorized!!!"
            });
        }
    }catch(err){
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

module.exports = router;

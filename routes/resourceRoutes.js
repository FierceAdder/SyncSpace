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

module.exports = router;

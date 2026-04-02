const verifyToken=require("../middleware/auth");
const express=require("express");
const crypto=require("crypto");
const User = require("../models/User");
const Group = require("../models/Group");


const router=express.Router();

const generateJoinCode=()=>{
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const randomValues = new Uint8Array(6);
    crypto.getRandomValues(randomValues); // Fills the array with cryptographically secure random numbers
    randomValues.forEach(value => {
        result += chars[value % chars.length]; // Use modulo to select a character within the bounds of the chars string
    });
    return result;
}

router.post("/create",verifyToken,async (req,res)=>{
    try{
        const details=req.body;
        const group=new Group({
            Group_Owner_Id : req.user.id,
            Group_Name : details.Group_Name,
            Members : [req.user.id],
            Join_Code : generateJoinCode()
        });
        await group.save();
        await User.findByIdAndUpdate(
            req.user.id,
            {$addToSet : {Groups_Created : group._id,Groups_Part_Of : group._id}}
        );
        res.status(201).json({
            "message" : "Group Created successfully"
        })
    }catch(err){
        console.log("Error : ",err);
        res.status(500).json({
            "message" : "Error Occured"
        })
    }

});

router.post('/join',verifyToken,async (req,res)=>{
    try{
        const recievedJoinCode = req.body.Join_Code;
        const group=await Group.findOne({Join_Code : recievedJoinCode});
        const groupId=group._id;
        if(!groupId){
            res.status(400).json({
                "message" : "Invalid Join Code, Group not found"
            })
        }else{
            await Group.findByIdAndUpdate(
                groupId,
                {
                    $addToSet : {
                        "Members" : req.user.id
                    }
                }
            );

            await User.findByIdAndUpdate(
                req.user.id,
                {
                    $addToSet : {
                        "Groups_Part_Of" : groupId 
                    }
                }
            );
            res.status(200).json({
                "message" : "Joined group succesfully."
            })
        }
    }catch(err){
        console.log("Error : ",err);
        res.status(500).json({
            "message" : "Error Occured"
        })
    }
});

router.delete('/:groupId/delete',verifyToken,async (req,res)=>{
    try{
        const userId=req.user.id;
        const groupId=req.params.groupId;
        const group=await Group.findById(groupId);
        if(!group){
            return res.status(404).json({
                "message" : "Group not Found."
            });
        }
        if(group.Group_Owner_Id.toString()===userId){
            await Resource.deleteMany({ Group_Posted_In: groupId });
            await User.updateMany( { Groups_Part_Of: groupId }, 
                { $pull: { Groups_Part_Of: groupId, Groups_Created: groupId } } );
            await group.deleteOne();
            return res.status(200).json({
                "message" : "Group deleted successfully"
            });
        }else{
            return res.status(403).json({
                "message" : "Unauthorized"
            });
        }
    }catch(err){
        console.log("Error : ",err);
        res.status(500).json({
            "message" : "Error Occured"
        })
    }
    
});

router.put('/:groupId/leave',verifyToken,async (req,res)=>{
    try {
        const userId=req.user.id;
        const groupId=req.params.groupId;
        const group=await Group.findById(groupId);
        if(userId===group.Group_Owner_Id.toString()){
            return res.status(405).json({
                "message" : "Group Owner can't abandon the group.Try deleting."
            });
        }else{
            await Group.findByIdAndUpdate(groupId, { $pull: { Members: req.user.id } })
            await User.findByIdAndUpdate(userId, { $pull: { Groups_Part_Of: groupId } })
            return res.status(200).json({
                "message" : "Group Left successfully."
            });
        }
    } catch (err) {
        console.log("Error : ",err);
        res.status(500).json({
            "message" : "Error Occured"
        })
    }
});

module.exports = router;

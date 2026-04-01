const express = require("express");
const User = require("../models/User");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const router=express.Router();
const jwtSecret=process.env.JWT_SECRET;


router.post('/register',async (req,res)=>{
    const details=req.body;
    try {
        const salt = await bcrypt.genSalt(11);
        details.Password = await bcrypt.hash(details.Password, salt);
        const newUser=new User({
            Email : details.Email,
            Password : details.Password,
            UserName : details.UserName
        })
        await newUser.save()

        res.status(201).json({
        message: 'User registered successfully',
        data: {
            "Email" : details.Email,
            "UserName" : details.UserName
        }
        });

    } catch (error) {
        
        res.status(400).json({
        message: 'Invalid Request! Try again later',
        data: details
        });

    }
});


router.post('/login',async (req,res)=>{
    try{
        const details = req.body;
        const recievedEmail = details.Email;
        const recievedPassword=details.Password;
        const user = await User.findOne({Email: recievedEmail});
        if(!user){
            res.status(400).json({
                "message" : "Invalid E-mail/Password, Try Again"
            });
        }else{
            const hashedPassword=user.Password;
            const valid=await bcrypt.compare(recievedPassword,hashedPassword);
            if(!valid){
                res.status(400).json({
                    "message" : "Invalid E-mail/Password, Try Again"
                });
            }else{
                const token = await jwt.sign({id : user._id},jwtSecret,{ expiresIn: '2h' });
                res.status(200).json({
                    "message" : "Login Successful!!!",
                    "token" : token
                });
            }
        }
    }catch(err){
        console.log("Login Failed, \nError : ",err);
        res.status(500).json({
            "message" : "Something's wrong on our end, please try again later."
        })
    }

});




module.exports=router;
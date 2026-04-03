const express=require('express');
const dotenv=require('dotenv').config();
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const cors = require("cors");
const app=express();
app.use(cors({ origin: "http://localhost:5173"}));
const MONGO_URI=process.env.MONGO_URI;
app.use(express.json());
app.use('/user', userRoutes);
app.use('/groups',groupRoutes);
app.use('/resources',resourceRoutes);
mongoose.connect(MONGO_URI)
.then(()=> console.log('Connected to MongoDB via mongoose'))
.catch(err => console.error("Encountered error while connecting to MongoDB : ",err));


app.get('/',(req,res)=>{
    res.send("<h1>Welcome to SyncSpace</h1>");
});

app.listen(3000,()=>{
    console.log("Server live on port 3000");
});

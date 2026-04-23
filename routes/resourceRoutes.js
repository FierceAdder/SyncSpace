const express=require("express");
const verifyToken=require("../middleware/auth");
const Resource=require("../models/Resources");
const User = require("../models/User");
const Group = require("../models/Group");
const ogs = require('open-graph-scraper');
const { generatePresignedUploadUrl, generatePresignedDownloadUrl } = require('../utils/s3');

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
                Description : (details.Description || '').slice(0, 100),
                Category : details.Category,
                Posted_By : userId
            });

            // Article type: save rich HTML body
            if(details.Resource_Type?.toLowerCase() === 'article'){
                newResource.Article_Body = details.Article_Body || '';
            }

            // File type: save S3 metadata
            if(details.Resource_Type?.toLowerCase() === 'file'){
                newResource.File_Key = details.File_Key || '';
                newResource.File_Size = details.File_Size || 0;
                newResource.File_Name = details.File_Name || '';
            }

            if(details.Resource_Type.toLowerCase()==="link" || details.Resource_Type.toLowerCase()==="video"){
                // Helper: extract YouTube video ID from various URL formats
                const getYouTubeId = (url) => {
                    try {
                        const u = new URL(url);
                        if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
                        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
                    } catch { /* ignore */ }
                    return null;
                };

                const ytId = getYouTubeId(details.Content);
                if (ytId) {
                    // Use YouTube's direct thumbnail CDN — no scraping needed
                    newResource.Thumbnail_url = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                    // Also try to fetch the OG title for YouTube
                    try {
                        const ogData = await ogs({ url: details.Content });
                        if (ogData?.result?.ogTitle) newResource.Original_title = ogData.result.ogTitle;
                    } catch { /* title is optional */ }
                } else {
                    // Non-YouTube: use OGS for full metadata
                    try{
                        const ogData = await ogs({ url: details.Content });
                        if (ogData && ogData.result) {
                            newResource.Thumbnail_url = ogData.result.ogImage ? ogData.result.ogImage[0].url : '';
                            newResource.Original_title = ogData.result.ogTitle || '';
                        }
                    }catch(err){
                        console.log("OG Scraping Error : ",err);
                    }
                    // Fallback to favicon if OGS gave nothing
                    if(!newResource.Thumbnail_url){
                        try{
                            const urlObj = new URL(details.Content);
                            newResource.Thumbnail_url = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
                        }catch(err){
                            console.log("Favicon Fetch Error : ",err);
                        }
                    }
                }
            }

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

// Generate presigned upload URL for file resources
router.post('/presign-upload', verifyToken, async (req, res) => {
    try {
        const { fileName, contentType, groupId } = req.body;
        
        if (!fileName || !contentType) {
            return res.status(400).json({ message: "fileName and contentType are required." });
        }

        const key = `resources/${groupId}/${Date.now()}-${fileName}`;
        const uploadUrl = await generatePresignedUploadUrl(key, contentType);

        res.status(200).json({
            uploadUrl,
            key,
            message: "Presigned upload URL generated."
        });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

// Generate presigned download URL for a file resource
router.get('/:resourceId/presign-download', verifyToken, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.resourceId);
        if (!resource || !resource.File_Key) {
            return res.status(404).json({ message: "File not found." });
        }

        const downloadUrl = await generatePresignedDownloadUrl(resource.File_Key);
        res.status(200).json({
            downloadUrl,
            fileName: resource.File_Name
        });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.get('/recents', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const resources = await Resource.find({ 
            Group_Posted_In: { $in: user.Groups_Part_Of } 
        })
        .sort({ createdAt: -1, _id: -1 }) 
        .limit(10)
        .populate('Posted_By', 'UserName Avatar_Url')
        .populate('Group_Posted_In', 'Group_Name');

        res.status(200).json({ resources });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.get('/search', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const searchQuery = req.query.q; 
        const sortBy = req.query.sort || 'relevance'; // 'relevance', 'newest', 'upvotes'
        
        if (!searchQuery) {
            return res.status(400).json({ message: "Search query is required." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        let findQuery;
        let sortOptions = {};

        // Try text index search first for speed, fall back to regex
        try {
            findQuery = {
                Group_Posted_In: { $in: user.Groups_Part_Of },
                $text: { $search: searchQuery }
            };

            // Test if text index works
            const testCount = await Resource.countDocuments(findQuery);
            
            if (sortBy === 'relevance') {
                sortOptions = { score: { $meta: 'textScore' } };
            } else if (sortBy === 'newest') {
                sortOptions = { createdAt: -1, _id: -1 };
            }
            // upvotes sorting handled after fetch
        } catch {
            // Fallback to regex search if text index not available
            const searchRegex = new RegExp(searchQuery, 'i');
            findQuery = {
                Group_Posted_In: { $in: user.Groups_Part_Of },
                $or: [
                    { Name: { $regex: searchRegex } },
                    { Category: { $regex: searchRegex } },
                    { Content: { $regex: searchRegex } },
                    { Description: { $regex: searchRegex } },
                    { Article_Body: { $regex: searchRegex } }
                ]
            };
            if (sortBy === 'newest') {
                sortOptions = { createdAt: -1, _id: -1 };
            }
        }

        let queryBuilder = Resource.find(findQuery);
        
        if (sortBy === 'relevance' && findQuery.$text) {
            queryBuilder = queryBuilder
                .select({ score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } });
        } else if (Object.keys(sortOptions).length > 0) {
            queryBuilder = queryBuilder.sort(sortOptions);
        }

        let resources = await queryBuilder
            .populate('Posted_By', 'UserName Avatar_Url')
            .populate('Group_Posted_In', 'Group_Name');

        // Sort by upvotes client-side (can't easily sort by array length in MongoDB)
        if (sortBy === 'upvotes') {
            resources = resources.sort((a, b) => 
                (b.Upvotes?.length || 0) - (a.Upvotes?.length || 0)
            );
        }

        res.status(200).json({ resources });
    } catch (err) {
        console.log("Error : ", err);
        res.status(500).json({ message: "Error Occured" });
    }
});

router.get("/:groupId",verifyToken,async (req,res)=>{
    try{
        const groupId=req.params.groupId;
        const userId=req.user.id;
        const isMember=(await User.exists({_id : userId,Groups_Part_Of : groupId}));
        if(isMember){
            // Exclude file resources that never completed their S3 upload (no File_Key)
            const resources = await Resource.find({
                Group_Posted_In: groupId,
                $nor: [{ Resource_Type: { $regex: /^file$/i }, File_Key: { $in: [null, ''] } }]
            })
                .populate('Posted_By', 'UserName Avatar_Url')
                .sort({ createdAt: -1, _id: -1 });
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

import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";

export async function POST(request){
   await dbConnect()
   try {
    const {username}=await request.json()
    const isUsername=await User.findOne({username})
    if(!isUsername){
        return Response.json({
            success:false,
            message:"User not found"
        },{status:400})
    }

    const userProfile=await User.aggregate([
        {
            $match:{_id: new mongoose.Types.ObjectId(isUsername._id)}
        },
        {
         $project:{
            username:1,
            fullName:1,
            avatar:1,
            uploadedVideos:1,
            subscribers:1,
            createdAt:1
         }
        },
        {
            $lookup:{
                from:"videos",
                localField:"uploadedVideos",
                foreignField: "_id",
                as:"uploadedVideos",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            views:1,
                            createdAt:1,
                            thumbnail:1
                        }
                    }
                ]

            }
        }
    ])
    if(userProfile[0].uploadedVideos.length==0){
        return Response.json({
            success:true,
           message:"No Videos From This Channel"
        },{status:200})
    
    }

    return Response.json({
        success:true,
        data:userProfile[0]
    },{status:200})

   } catch (error) {
    console.log("server pr kuch galt hua",error);
    
    return Response.json({
        success:false,
       message:"something went wrong on server"
    },{status:500})
   }
}
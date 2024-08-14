import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import mongoose from "mongoose";

export async function GET(){
   await dbConnect()
   const session = await getServerSession(authOptions);
   const _user = session?.user;  // Handle potential undefined session

   if (!_user || !session) {
       return NextResponse.json({
           success: false,
           message: 'Not Authenticated',
       }, { status: 400 });
   }
   try {
   
    const isUser=await User.findById(_user._id)
    if(!isUser){
        return Response.json({
            success:false,
            message:"User not found"
        },{status:400})
    }

    const userWatchHistory=await User.aggregate([
        {
            $match:{_id: new mongoose.Types.ObjectId(_user._id)}
        },
        {
         $project:{
            watchHistory:1,
           
         }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField: "_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                      avatar:1,
                                      username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            title:1,
                            views:1,
                            createdAt:1,
                            thumbnail:1,
                            owner:1
                        }
                    }
                ]

            }
        }
    ])
    if(userWatchHistory[0].watchHistory.length==0){
        return Response.json({
            success:true,
           message:"No Watch-History Found"
        },{status:200})
    
    }

    return Response.json({
        success:true,
        data:userWatchHistory[0]
    },{status:200})

   } catch (error) {
    console.log("server pr kuch galt hua",error);
    
    return Response.json({
        success:false,
       message:"something went wrong on server"
    },{status:500})
   }
}
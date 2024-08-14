import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";



export async function GET(){
const session=await getServerSession(authOptions)
const _user=session?.user
if(!_user || !session){
    return Response.json({
        success:false,
        message:"Not Authenticated"
    },{status:400})
}
try {
    await dbConnect()
    const user=await User.aggregate([
        {
            $match:{_id:new mongoose.Types.ObjectId(_user._id)}
        },
        {
          $project:{
            liked:1,
            uploadedVideos:1,
            username:1,
            fullName:1,
            avatar:1,
            subscribers:1,
            watchHistory:1

          }
        },
        {
            $lookup:{
                from:"videos",
                localField:"liked",
                foreignField:"_id",
                as:"liked",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                       username:1,
                                       avatar:1
                                    }
                                }
                            ]
                        }

                    },
                    {
                        $project:{
                            owner:1,
                            thumbnail:1,
                            title:1,
                            views:1,
                            likes:1
                        }
                    }
                ]
            }
           
        },
        {
            $lookup:{
                from:"videos",
                localField:"uploadedVideos",
                foreignField:"_id",
                as:"uploadedVideos",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                       username:1,
                                       avatar:1
                                    }
                                }
                            ]
                        }

                    },
                    {
                        $project:{
                            owner:1,
                            thumbnail:1,
                            title:1,
                            description:1,
                            views:1,
                            likes:1
                        }
                    }
                ]
            },
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                       username:1,
                                       avatar:1
                                    }
                                }
                            ]
                        }

                    },
                    {
                        $project:{
                            thumbnail:1,
                            title:1,
                            views:1,
                            likes:1,
                            owner:1
                        }
                    }
                ]
            },  
        }
    ])
if(user[0].liked?.length==0){
    return Response.json({
        success:true,
       message:"No Liked Videos"
    },{status:200})
}
    

    return Response.json({
        success:true,
        data:user[0]
    },{status:200})
} catch (error) {
    console.log("kuch galt hai",error);
        
    return Response.json({
        success:false,
        message:"Something went wrong"
    },{status:500})
}
}

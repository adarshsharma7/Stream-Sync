import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import {Videos} from "@/models/videos.models"



export async function POST(request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        console.log("User is not authenticated");
        return Response.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        const {videoId}=await request.json()
        let video=await Videos.findById(videoId)
        if(!video){
             return Response.json({
            success: false,
            message: 'video not found',
        }, { status: 400 });
        }
       await User.updateOne({ _id: _user._id }, { $pull: { uploadedVideos: videoId } });
       await Videos.findByIdAndDelete(videoId)
      
       
        return Response.json({
            success: true,
          message:"Video Deleted"
        }, { status: 200 });
        
       

    } catch (error) {
        console.log("kuch galtb hua",error);
        
        return Response.json({
            success: false,
            message:"something went wrong"
        }, { status: 500 });
    }
}
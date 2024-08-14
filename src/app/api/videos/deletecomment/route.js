import { dbConnect } from "@/dbConfig/dbConfig";
import { Videos } from "@/models/videos.models";
import {Comment} from "@/models/comment.models"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";



export async function POST(request){

    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session.user;

    if (!user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        const {commentId,videoId}=await request.json()
        let comment=await Comment.findById(commentId)
        let video=await Videos.findById(videoId)
        if(!comment){
            return NextResponse.json({
                success: false,
                message: 'comment not found',
            }, { status: 400 });
        }
        if(!video){
            return NextResponse.json({
                success: false,
                message: 'video not found',
            }, { status: 400 });
        }
        await Videos.updateOne({_id:videoId},{$pull:{comments:commentId}})
        await Comment.findByIdAndDelete(commentId)
        return NextResponse.json({
            success: true,
            message: 'comment deleted',
        }, { status:200})
    } catch (error) {
        console.log("kuch galt huaa",error);
        
        return NextResponse.json({
            success: false,
            message: 'something wrong',
        }, { status:500})
    }
}
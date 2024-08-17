import { dbConnect } from "@/dbConfig/dbConfig";
import {Comment} from "@/models/comment.models"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import {CommentReply} from "@/models/commentreply.models"



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
        const {commentReplyId,commentId}=await request.json()
        let commentReply=await CommentReply.findById(commentReplyId)
        let comment=await Comment.findById(commentId)
        if(!commentReply){
            return NextResponse.json({
                success: false,
                message: 'comment Reply not found',
            }, { status: 400 });
        }
        if(!comment){
            return NextResponse.json({
                success: false,
                message: 'Comment not found',
            }, { status: 400 });
        }
        await Comment.updateOne({_id:commentId},{$pull:{replies:commentReplyId}})
        await CommentReply.findByIdAndDelete(commentReplyId)
        return NextResponse.json({
            success: true,
            message: 'comment reply deleted',
        }, { status:200})
    } catch (error) {
        console.log("kuch galt huaa",error);
        
        return NextResponse.json({
            success: false,
            message: 'something wrong',
        }, { status:500})
    }
}
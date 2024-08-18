import { dbConnect } from "@/dbConfig/dbConfig";
import { Videos } from "@/models/videos.models";
import { Comment } from "@/models/comment.models"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { CommentReply } from "../../../../models/commentreply.models";




export async function POST(request) {

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
        const { content, commentId,repliedId } = await request.json()
        
        let comment = await Comment.findById(commentId)
        if (!comment) {
            return Response.json({
                success: false,
                message: 'Comment not found',
            }, { status: 400 });
        }
        
        let newCommentReply = await CommentReply.create({
            content: content,
            likes: [],
            replies:repliedId ? [repliedId] : [],
            replyOnComment: commentId,
            owner: user._id
        })
    
        
        comment.replies.push(newCommentReply._id)
        await comment.save()
        return Response.json({
            success: true,
            message: 'Comment Reply added',
            data: newCommentReply
        }, { status: 200 });

    } catch (error) {
        console.log("kuch galt hua", error);

        return Response.json({
            success: false,
            message: 'something went wrong ',
        }, { status: 500 });
    }
}
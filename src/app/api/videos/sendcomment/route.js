import { dbConnect } from "@/dbConfig/dbConfig";
import { Videos } from "@/models/videos.models";
import { Comment } from "@/models/comment.models"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";



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
        const { content, videoId } = await request.json()


        let video = await Videos.findById(videoId)
        if (!video) {
            return Response.json({
                success: false,
                message: 'Video not found',
            }, { status: 400 });
        }
        let newComment = await Comment.create({
            content: content,
            likes: [],
            commentOnVideo: videoId,
            owner: user._id
        })
        video.comments.push(newComment._id)
        await video.save()
        return Response.json({
            success: true,
            message: 'Comment added',
            data: newComment
        }, { status: 200 });

    } catch (error) {
        console.log("kuch galt hua", error);

        return Response.json({
            success: false,
            message: 'something went wrong ',
        }, { status: 500 });
    }
}
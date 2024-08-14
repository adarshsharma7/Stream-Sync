import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import {Videos} from "@/models/videos.models"
import {Comment} from "@/models/comment.models"



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
        const {commentId}=await request.json()
        console.log("commentId h yee", commentId);
        
        const user=await User.findById(_user._id)
        const comment=await Comment.findById(commentId)
        const commentLiked = await Comment.findOne({
            _id: commentId,
            likes: user._id
        });
        if(commentLiked){
            console.log("deltee like");
            
            await Comment.updateOne({ _id: commentId }, { $pull: { likes: user._id } });
        }else{
            console.log("doo like");
          comment.likes.push(user._id)  
          await comment.save()
        }
        return Response.json({
            success:true,
            message:"comment liked"
        },{status:200})

    } catch (error) {
        console.log("kuch galt huaaaaa" ,error);
        
        return Response.json({
            success:false,
            message:"something wrong"
        },{status:500})
}
}
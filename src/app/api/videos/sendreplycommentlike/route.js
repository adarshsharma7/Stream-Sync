import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import {CommentReply} from '@/models/commentreply.models'


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
        
        
        const user=await User.findById(_user._id)
        const commentreply=await CommentReply.findById(commentId)
        
        const commentLiked = await CommentReply.findOne({
            _id: commentId,
            likes: user._id
        });
        if(commentLiked){
            console.log("deltee like");
            
            await CommentReply.updateOne({ _id: commentId }, { $pull: { likes: user._id } });
        }else{
            console.log("doo like");
            commentreply.likes.push(user._id)  
          await commentreply.save()
        }
        return Response.json({
            success:true,
            message:"Reply comment liked"
        },{status:200})

    } catch (error) {
        console.log("kuch galt huaaaaa" ,error);
        
        return Response.json({
            success:false,
            message:"something wrong"
        },{status:500})
}
}
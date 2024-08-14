import { dbConnect } from "@/dbConfig/dbConfig";
import { Comment } from "@/models/comment.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";



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
        const {content,commentId}=await request.json()
      
        
        let comment=await Comment.findById(commentId)
        if(!comment){
            return Response.json({
                success: false,
                message: 'Comment not found',
            }, { status: 400 });
        }
       const updatedComment = await Comment.findByIdAndUpdate(commentId,{$set:{content:content,edited:true} },{new:true})
    //    console.log(updatedComment);
       
        return Response.json({
            success: true,
            message: 'Comment edited',
        }, { status: 200 });

    } catch (error) {
        console.log("kuch galt hua",error);
        
        return Response.json({
            success: false,
            message: 'something went wrong ',
        }, { status: 500 });
    }
}
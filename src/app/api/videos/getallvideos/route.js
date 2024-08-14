import { dbConnect } from "@/dbConfig/dbConfig";
import { Videos } from "@/models/videos.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";


export async function GET(){
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        console.log("User is not authenticated");
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    
await dbConnect()
try {
    let user=await User.findById(_user._id)
    const allVideos=await Videos.aggregate([
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },{
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        },{
            $project:{
                _id:1,
                thumbnail:1,
                title:1,
                createdAt:1,
                description:1,
                views:1,
                "owner.username":1,
                "owner.avatar":1,
    
            }
        }
    ])

    if(!allVideos.length){
        return Response.json(
            {
              success: false,
              message:"No Videos"
            },
            { status: 400 }
          );
    }
    return Response.json(
        {
          success: true,
          data:allVideos,
          currentUser:user.avatar
          
        },
        { status: 200 }
      );
    
} catch (error) {
console.log("kuch galt hua",error);

    return Response.json(
        {
          success: false,
          message:"Something kuch galt"
        },
        { status: 500 }
      );
}

}

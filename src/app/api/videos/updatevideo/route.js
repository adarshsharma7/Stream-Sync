import { dbConnect } from "@/dbConfig/dbConfig";
import { Videos } from "@/models/videos.models";
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
        const {videoId,title,description}=await request.json()
      
        
        let video=await Videos.findById(videoId)
        if(!video){
            return Response.json({
                success: false,
                message: 'Video not found',
            }, { status: 400 });
        }
       const updatedVideo = await Videos.findByIdAndUpdate(videoId,{$set:{title:title,description:description} },{new:true})
        return Response.json({
            success: true,
            message: 'Video edited',
        }, { status: 200 });

    } catch (error) {
        console.log("kuch galt hua",error);
        
        return Response.json({
            success: false,
            message: 'something went wrong ',
        }, { status: 500 });
    }
}
import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { Videos } from "@/models/videos.models"


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
        const { videoId } = await request.json()
        let video = await Videos.findById(videoId)
        let user = await User.findById(_user._id)
        if (!video) {
            return Response.json({
                success: false,
                message: "Video not found"
            }, { status: 400 })
        }
        const getWatchLaterAdded = await User.findOne({
            _id: user._id,
            watchLater: videoId
        });
        if(getWatchLaterAdded){
            return Response.json({
                success: true,
                message: "Already added to watch later"
            }, { status: 200 })
        }
        return Response.json({
            success: true,
            message: "Not added"
        }, { status: 200 })
       
    } catch (error) {
        console.log("kuch galt hua", error);

        return Response.json({
            success: false,
            message: "something went wrong"
        }, { status: 500 })
    }
}

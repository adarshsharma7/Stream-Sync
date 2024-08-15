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
        // Check if the user is already liked
        const isAlreadywatchLaterAdded = await User.findOne({
            _id: user._id,
            watchLater: videoId
        });
        if (isAlreadywatchLaterAdded) {
            let updatedUser = await User.updateOne({ _id: _user._id }, { $pull: { watchLater: videoId } });
            return Response.json({
                success: true,
                message: "Video deleted from your Watch Later"
            }, { status: 200 })
        }
        user.watchLater.push(videoId)
        user.save()
        return Response.json({
            success: true,
            message: "Video added to your Watch Later"
        }, { status: 200 })



    } catch (error) {
        console.log("kuch galt hua", error);

        return Response.json({
            success: false,
            message: "something went wrong"
        }, { status: 500 })
    }
}
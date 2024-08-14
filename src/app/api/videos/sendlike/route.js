import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { NextResponse } from "next/server"; // Import NextResponse
import { Videos } from "@/models/videos.models";

export async function POST(request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }

    try {
        const { videoId } = await request.json();
        const video = await Videos.findById(videoId);
        const user = await User.findById(_user._id);

        if (!video) {
            return NextResponse.json({
                success: false,
                message: 'Video not found',
            }, { status: 400 });
        }

        // Check if the user is already liked
        const userLiked = await User.findOne({
            _id: user._id,
            liked: videoId
        });

        if (userLiked) {
            // Unsubscribe logic
            video.likes -= 1;
            await video.save();

            await User.updateOne({ _id: user._id }, { $pull: { liked: videoId } });
            return NextResponse.json({
                success: true,
                message: 'Unliked',
            }, { status: 200 });
        } else {
            // Subscribe logic
            video.likes += 1;
            await video.save();

            user.liked.push(videoId);
            await user.save();

            return NextResponse.json({
                success: true,
                message: 'Liked',
            }, { status: 200 });
        }
    } catch (error) {
        console.log("kuch galt hua like krne me", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}

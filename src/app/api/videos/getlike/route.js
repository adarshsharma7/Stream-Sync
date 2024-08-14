import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { NextResponse } from "next/server";
import { Videos } from "@/models/videos.models";




export async function POST(request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        console.log("User is not authenticated");
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    
    try {
        const { videoId } = await request.json();
       

        if (!videoId) {
            console.log("videoId not provided in the request");
            return NextResponse.json({
                success: false,
                message: 'videoId not provided',
            }, { status: 400 });
        }

        const video = await Videos.findById(videoId);
        const user = await User.findById(_user._id);

        if (!video) {
            console.log("Video not found");
            return NextResponse.json({
                success: false,
                message: 'Video not found',
            }, { status: 400 });
        }

        const videoLiked = await User.findOne({
            _id: user._id,
            liked: videoId
        });

        if (videoLiked) {
            return NextResponse.json({
                success: true,
                message: 'Liked',
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: true,
                message: 'Unliked',
            }, { status: 200 });
        }
    } catch (error) {
        console.log("Error during like check:", error);
        return NextResponse.json({
            success: false,
            message: "Something went wrong",
        }, { status: 500 });
    }
}

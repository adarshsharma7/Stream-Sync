import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { NextResponse } from "next/server";






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
        const { owner } = await request.json();
        console.log("Received owner:", owner);

        if (!owner) {
            console.log("Owner not provided in the request");
            return NextResponse.json({
                success: false,
                message: 'Owner not provided',
            }, { status: 400 });
        }

        const videoOwner = await User.findById(owner);
        const user = await User.findById(_user._id);

        if (!videoOwner) {
            console.log("Video owner not found");
            return NextResponse.json({
                success: false,
                message: 'Video owner not found',
            }, { status: 400 });
        }

        const userSubscribed = await User.findOne({
            _id: user._id,
            subscriptions: owner
        });

        if (userSubscribed) {
            return NextResponse.json({
                success: true,
                message: 'Subscribed',
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: true,
                message: 'Unsubscribed',
            }, { status: 200 });
        }
    } catch (error) {
        console.log("Error during subscription check:", error);
        return NextResponse.json({
            success: false,
            message: "Something went wrong",
        }, { status: 500 });
    }
}

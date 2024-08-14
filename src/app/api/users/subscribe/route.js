import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { NextResponse } from "next/server"; // Import NextResponse

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
        const { owner } = await request.json();
        const videoOwner = await User.findById(owner);
        const user = await User.findById(_user._id);

        if (!videoOwner) {
            return NextResponse.json({
                success: false,
                message: 'Video owner not found',
            }, { status: 400 });
        }

        // Check if the user is already subscribed
        const userSubscribed = await User.findOne({
            _id: user._id,
            subscriptions: owner
        });

        if (userSubscribed) {
            // Unsubscribe logic
            videoOwner.subscribers -= 1;
            await videoOwner.save();

            await User.updateOne({ _id: user._id }, { $pull: { subscriptions: owner } });
            return NextResponse.json({
                success: true,
                message: 'Unsubscribed',
            }, { status: 200 });
        } else {
            // Subscribe logic
            videoOwner.subscribers += 1;
            await videoOwner.save();

            user.subscriptions.push(owner);
            await user.save();

            return NextResponse.json({
                success: true,
                message: 'Subscribed',
            }, { status: 200 });
        }
    } catch (error) {
        console.log("kuch galt hua subscribe krne me", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}

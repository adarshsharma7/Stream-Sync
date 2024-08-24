import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { NextResponse } from "next/server"; // Import NextResponse
import mongoose from "mongoose";


export async function GET() {

    const session = await getServerSession(authOptions);
    const _user = session.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        await dbConnect();
        const user = await User.findById(_user._id);
        let stories = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(user._id) }
            }, {
                $project: {
                    subscriptions: 1
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriptions",
                    foreignField: "_id",
                    as: "subscriptions",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                stories: 1
                            }
                        },
                        {
                            $lookup: {
                                from: "stories",
                                localField: "stories",
                                foreignField: "_id",
                                as: "stories",
                                pipeline: [
                                    {
                                        $project: {
                                            file: 1
                                        }
                                    }
                                ]

                            }
                        }
                    ]
                }
            }
        ])
        return NextResponse.json({
            success: true,
            data: stories[0]
        }, { status: 200 })

    } catch (error) {
        console.log("kuch galt huaa", error);

        return NextResponse.json({
            success: false,
            message: "something galt hua"
        }, { status: 500 })

    }
}
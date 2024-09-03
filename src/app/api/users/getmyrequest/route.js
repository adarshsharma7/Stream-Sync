import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from 'mongoose';



export async function GET() {
    const session = await getServerSession(authOptions);
    const _user = session?.user;
    if (!_user || !session) {
        return Response.json({
            success: false,
            message: "Not Authenticated"
        }, { status: 400 });
    }

    try {
        await dbConnect();
        let user = await User.findById(_user._id)
        let notifications = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(_user._id) }
            },
            {
                $project: {
                    notifications: 1,
                    requests: 1
                }
            },
            {
                $lookup: {
                    from: "notifications",
                    localField: "notifications",
                    foreignField: "_id",
                    as: "notifications",
                    pipeline: [
                        {

                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            _id:1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                   
                                ]

                            }
                        },
                        {
                            $addFields: {
                                owner: { $arrayElemAt: ["$owner", 0] }
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "requests",
                    foreignField: "_id",
                    as: "requests",
                    pipeline: [
                        {
                            $project: {
                                avatar: 1,
                                username: 1,
                            }
                        }
                    ]
                }
            },

        ]);



        return Response.json({
            success: true,
            data: user.myrequests,
            notifications: notifications[0].notifications,
            isNewNotification: user.isNewNotification,
            isNewMsgNotification:user.newMsgNotificationDot,
            frndId:user.chatfrnd
        }, { status: 200 });

    } catch (error) {
        console.log("kuch galt hua", error);

        return Response.json({
            success: false,
            message: "problemm"
        }, { status: 500 });
    }
}
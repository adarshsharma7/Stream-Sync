import { dbConnect } from "@/dbConfig/dbConfig";
import { Videos } from "@/models/videos.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";
import User from "@/models/userModel";


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

        // Find the video by ID and populate fields
        let video = await Videos.findById(videoId)
        let user = await User.findById(_user._id)


        if (!video) {
            return Response.json({
                success: false,
                message: "Video not found"
            }, { status: 400 });
        }

        video.views++
        await video.save()

        if (user.triggerWatchHistory) {
            user.watchHistory.push(videoId)
            await user.save()
        }


        const videoTarget = await Videos.aggregate(
            [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(videoId)
                    }
                },
           
            {
                $project: {
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    likes: 1,
                    comments: 1,
                    owner: 1,
                    createdAt: 1
                }
            },
            {
                $lookup: {
                    from: "comments",
                    localField: "comments",
                    foreignField: "_id",
                    as: "comments",
                    pipeline: [
                       
                        {
                            $lookup: {
                                from: "commentreplies",
                                localField: "replies",
                                foreignField: "_id",
                                as: "replies",
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
                                                        _id: 1,
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
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            content: 1,
                                            edited: 1,
                                            likes: 1,
                                            owner: 1,
                                            createdAt:1,
                                            updatedAt:1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
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
                        },
                        {
                            $project: {
                                content: 1,
                                edited: 1,
                                likes: 1,
                                replies: 1,
                                owner: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                                subscribers: 1
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
            ]);


        return Response.json({
            success: true,
            message: "Video found",
            data: videoTarget[0]
        }, { status: 200 });
    } catch (error) {
        console.log("something error while playing video", error);

        return Response.json({
            success: false,
            message: "something error while playing video",
        }, { status: 500 });
    }
}

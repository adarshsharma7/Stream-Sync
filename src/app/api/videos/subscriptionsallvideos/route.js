import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";
import { NextResponse } from "next/server"; // Correct Import
import mongoose from "mongoose";



export async function GET() {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session?.user;  // Handle potential undefined session

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }

    try {

        const userSubscriptions = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(_user._id) }
            },
            {
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
                            $lookup: {
                                from: "videos",
                                localField: "uploadedVideos",
                                foreignField: "_id",
                                as: "uploadedVideos",
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
                                                        username: 1,
                                                        avatar: 1
                                                    }
                                                },

                                            ]
                                        }
                                    },
                                    {
                                        $project: {
                                            _id:1,
                                            title: 1,
                                            thumbnail: 1,
                                            views: 1,
                                            createdAt:1,
                                            owner:1
    
                                        }
                                    }
                                ]


                            }
                        },
                        {
                            $project: {
                               
                               avatar:1,
                               username:1,
                               uploadedVideos:1

                            } 
                        }
                    ]
                }
            }

        ])


        // const userSubscriptions = await User.aggregate([
        //     // Match the specific user by _id
        //     { $match: { _id: new mongoose.Types.ObjectId(_user._id) } },

        //     // Populate subscriptions with user details
        //     {
        //         $lookup: {
        //             from: "users",
        //             localField: "subscriptions",
        //             foreignField: "_id",
        //             as: "subscriptions"
        //         }
        //     },

        //     // Unwind subscriptions to process each subscribed user individually
        //     { $unwind: "$subscriptions" },

        //     // Populate uploadedVideos for each subscribed user
        //     {
        //         $lookup: {
        //             from: "videos",
        //             localField: "subscriptions.uploadedVideos",
        //             foreignField: "_id",
        //             as: "subscriptions.uploadedVideos"
        //         }
        //     },

        //     // Populate owner for each uploaded video
        //     {
        //         $lookup: {
        //             from: "users",
        //             localField: "subscriptions.uploadedVideos.owner",
        //             foreignField: "_id",
        //             as: "subscriptions.uploadedVideos.owner"
        //         }
        //     },

        //     // Unwind uploadedVideos to process each video individually
        //     { $unwind: "$subscriptions.uploadedVideos" },

        //     // Unwind owner to get owner details
        //     { $unwind: "$subscriptions.uploadedVideos.owner" },

        //     // Project the desired fields
        //     {
        //         $project: {
        //             _id: 0,
        //         "subscriptions._id": 1,
        //         "subscriptions.username": 1,
        //         "subscriptions.uploadedVideos._id": 1,
        //         "subscriptions.uploadedVideos.thumbnail": 1,
        //         "subscriptions.uploadedVideos.title": 1,
        //         "subscriptions.uploadedVideos.likes": 1,
        //         "subscriptions.uploadedVideos.views": 1,
        //         "subscriptions.uploadedVideos.createdAt": 1,
        //         "subscriptions.uploadedVideos.owner.createdAt": 1,
        //         "subscriptions.uploadedVideos.owner.avatar": 1,
        //         "subscriptions.uploadedVideos.owner.username": 1,
        //         }
        //     },

        //     // Group by subscription to combine videos for each subscribed user
        //     {
        //         $group: {
        //             _id: "$subscriptions._id",
        //             subscriptions: { $first: "$subscriptions" },
        //             uploadedVideos: { $push: "$subscriptions.uploadedVideos" }
        //         }
        //     },

        // ]);
        console.log(userSubscriptions);

        return NextResponse.json({
            success: true,
            message: "Subscriptions found",
            data: userSubscriptions
        }, { status: 200 });

    } catch (error) {
        console.log("Error finding subscriptions:", error);

        return NextResponse.json({
            success: false,
            message: "Error finding subscriptions",
        }, { status: 500 });
    }
}

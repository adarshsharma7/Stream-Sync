import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";


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
        let subscription = await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(_user._id) }
            }, {
                $project: {
                    subscriptions: 1
                }
            }, {
                $lookup: {
                    from: "users",
                    localField: "subscriptions",
                    foreignField: "_id",
                    as: "subscriptions",
                    pipeline: [
                        {
                            $project: {
                                avatar: 1,
                                username: 1,
                                fullName: 1
                            }
                        }
                    ]
                }
            }
        ])
        if (subscription[0].length == 0) {
            return Response.json({
                success: true,
                message: "No Subscription "
            }, { status: 200 })
        }
        return Response.json({
            success: true,
           data:subscription[0].subscriptions
        }, { status: 200 })
    } catch(error) {
        console.log(error);
        
        return Response.json({
            success: false,
         message:"kuch galt"
        }, { status: 500 })
    }
}
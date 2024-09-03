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
     

        let frnd=await User.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(_user._id) }
            },
            {
                $project: {
                    chatfrnd:1
                }
            },{
                $lookup:{
                    from: "users",
                    localField: "chatfrnd",
                    foreignField: "_id",
                    as: "chatfrnd",
                    pipeline:[
                        {
                            $project:{
                                _id:1,
                                username:1,
                                avatar:1
                            }
                        }
                    ]
                }
            }
        ])
      
        
        return Response.json({
            success: true,
            message: "done",
            data:frnd[0].chatfrnd
        }, { status: 200 });
    } catch (error) {
        console.log("dikkat h", error);

        return Response.json({
            success: false,
            message: "problemm"
        }, { status: 500 });
    }
}
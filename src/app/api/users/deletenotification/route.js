import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { Notifications } from "@/models/notifications.models"


export async function POST(request) {
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
        const { Id } = await request.json()

        await User.updateOne({ _id: _user._id }, { $pull: { notifications: Id } });
        await Notifications.findByIdAndDelete(Id)

        return Response.json({
            success: true,
            message: "done",
          
        }, { status: 200 });
    } catch (error) {
        console.log("dikkat h", error);

        return Response.json({
            success: false,
            message: "problemm"
        }, { status: 500 });
    }
}
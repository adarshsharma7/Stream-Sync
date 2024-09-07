import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { Notifications } from "@/models/notifications.models"
import Pusher from 'pusher';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});


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
        const { chatId } = await request.json()
        let recipent = await User.findById(chatId)
        let user = await User.findById(_user._id)


        await User.updateOne({ _id: recipent._id }, { $pull: { chatfrnd: user._id } })
        let updatedUser = await User.updateOne({ _id: user._id }, { $pull: { chatfrnd: recipent._id } }, { new: true })

        

        let notifi = await Notifications.create({
            msg: "remove",
            owner: user._id
        })
        await pusher.trigger(`private-${recipent._id}`, 'removeFrnd', {
            notificationId: notifi._id,
            username: user.username,
            avatar: user.avatar,
            Id: user._id

        });


        return Response.json({
            success: true,
            message: "done",
            data: updatedUser.chatfrnd

        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chat history:", error);

        return Response.json({
            success: false,
            message: "Problem fetching chat history"
        }, { status: 500 });
    }
}

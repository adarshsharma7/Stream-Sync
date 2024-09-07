import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Pusher from 'pusher';
import { Notifications } from "@/models/notifications.models"
// Initialize Pusher
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
        let { username,currNotificationId } = await request.json()
        let user = await User.findOne({ username })
        let iam = await User.findById(_user._id)



       
        await User.updateOne({ _id: _user._id }, { $pull: { requests: user._id } });
        await User.updateOne({ _id: user._id }, { $pull: { myrequests: { username: iam.username } } });




        let notifi = await Notifications.create({
            msg: "accept",
            owner: iam._id
        })
        let notifiForMe = await Notifications.create({
            msg: "urnowfrnd",
            owner: user._id
        })
        iam.chatfrnd.push(user._id)
        iam.notifications.push(notifiForMe._id)
        await iam.save()


        user.notifications.push(notifi._id)
        user.chatfrnd.push(iam._id)
        await user.save()

        await pusher.trigger(`private-${user._id}`, 'acceptRequest', {
            notificationId: notifi._id,
            username: iam.username,
            avatar: iam.avatar,
            Id: iam._id,
            status: iam.status
        });
        await Notifications.findByIdAndDelete(currNotificationId)

        return Response.json({
            success: true,
            message: "done",
            chatfrndid: user._id,
            notificationForMe:{_id:notifiForMe._id,msg:"urnowfrnd",owner:{_id:user._id,avatar: user.avatar,username: user.username}},
            data: { username: user.username, avatar: user.avatar, status: user.status, _id: user._id }
        }, { status: 200 });
    } catch (error) {
        console.log("dikkat", error);

        return Response.json({
            success: false,
            message: "problemm"
        }, { status: 500 });
    }
}
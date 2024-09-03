import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Pusher from 'pusher';
import {Notifications} from "@/models/notifications.models"

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
        let { username } = await request.json()
        let user = await User.findOne({ username })
        let iam = await User.findById(_user._id)

        let notification = await Notifications.create({
            msg: "wants frnd ",
            owner: _user._id
        })

        user.requests.push(_user._id)
        user.notifications.push(notification._id)
        await user.save()
        iam.myrequests.push({username,notificationId:notification._id})
        await iam.save()

        await pusher.trigger(`private-${user._id}`, 'msgRequest', {
            Id:notification._id,
            ownerId:iam._id,
            avatar: iam.avatar,
            username: iam.username
        });



        return Response.json({
            success: true,
            message: "done"
        }, { status: 200 });
    } catch (error) {
        console.log("dikkat", error);

        return Response.json({
            success: false,
            message: "problemm"
        }, { status: 500 });
    }
}
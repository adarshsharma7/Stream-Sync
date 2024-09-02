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
  
      
        
        iam.chatfrnd.push(user._id)
        await iam.save()


        let notifi = await Notifications.create({
            msg: "accept",
            owner: iam._id
        })
     
        
        user.notifications.push(notifi._id)
        user.chatfrnd.push(iam._id)
        await user.save()
        
        await pusher.trigger(`private-${user._id}`, 'acceptRequest', {
            Id:notifi._id,
           username:iam.username,
           avatar:iam.avatar
        });
        
        return Response.json({
            success: true,
            message: "done",
            data:{username:user.username,avatar:user.avatar}
        }, { status: 200 });
    } catch (error) {
        console.log("dikkat", error);

        return Response.json({
            success: false,
            message: "problemm"
        }, { status: 500 });
    }
}
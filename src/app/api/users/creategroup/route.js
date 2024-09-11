import { dbConnect } from '@/dbConfig/dbConfig';
import Chat from '@/models/chat.models';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from 'mongoose';
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
        let { users } = await request.json();

        const sender = await User.findById(_user._id);
        if(!users.includes(sender._id)){
             users.push(sender._id);
        }
       
        const objectIds = users.map(id => new mongoose.Types.ObjectId(id));
        users = objectIds
        // Validate input
        if (!users || users.length < 2) {
            return Response.json({
                success: false,
                message: "Invalid group data"
            }, { status: 400 });
        }
        // Add sender to users array if not already included



        // Create a new group chat
        const newGroupChat = new Chat({
            participants: users,
            groupAdmin: _user._id,
            isGroupChat: true
        });

        await newGroupChat.save();

        // Notify all group participants (optional)
        // pusher.trigger('group-channel', 'groupCreated', {
        //     chatId: newGroupChat._id,
        //     groupName: newGroupChat.groupName,
        //     adminId: newGroupChat.groupAdmin,
        //     participants: newGroupChat.participants
        // });

        // Create the group object to push into each user's `group` array


        const groupObject = {
            avatar: sender.avatar,
            username: sender.username,
            _id: sender._id,
            groupId: newGroupChat._id,
            members: users
        };


        // Push the group object into the group members' group array
        await User.updateMany(
            { _id: { $in: users } }, // Update all users in the provided array
            { $push: { group: groupObject } }
        );

        users.forEach(userId => {
            pusher.trigger(`private-${userId}`, 'newGroup', groupObject);
        });


        return Response.json({
            success: true,
            groupId: newGroupChat._id
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating group chat:", error);

        return Response.json({
            success: false,
            message: "Problem creating group chat"
        }, { status: 500 });
    }
}


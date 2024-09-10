import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Chat from '@/models/chat.models';

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
        await dbConnect()
        const { chatId, isTyping } = await request.json()

        const recipient = await User.findById(chatId);
        const sender = await User.findById(_user._id);

        let chat = await Chat.findOne({
            participants: { $all: [sender._id, recipient._id] }
        });

        if (!chat) {
            chat = new Chat({ participants: [sender._id, recipient._id] });
        }
        // Trigger the Pusher event for real-time updates
        let uniqueChatId = chat._id.toString()

        await pusher.trigger(`private-${uniqueChatId}`, 'isUserTyping', {
            isTyping,
            userTypingId:sender._id
        });



        return Response.json({
            success: true,
            message: "done",


        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chat history:", error);

        return Response.json({
            success: false,
            message: "Problem fetching chat history"
        }, { status: 500 });
    }
}

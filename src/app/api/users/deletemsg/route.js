import { dbConnect } from '@/dbConfig/dbConfig';
import Chat from '@/models/chat.models';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
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
        const { chatId,msgId } = await request.json();
        const recipient = await User.findById(chatId);
        const sender = await User.findById(_user._id);




        let chat = await Chat.findOne({
            participants: { $all: [sender._id, recipient._id] }
        });
       

        if (!chat) {
            return Response.json({
                success: true,
                message: "no message found for delete message"
            }, { status: 400 });
        }
      
        const updatedMessages = chat.messages.filter((message) => message._id.toString()!==msgId.toString());
       
        // Update chat with the modified messages
        chat.messages = updatedMessages;
        await chat.save()

        const updatedChat = await Chat.findOne({
            participants: { $all: [sender._id, recipient._id] }
        }).populate('messages.sender', 'username');
    



         // Trigger the Pusher event for real-time updates
         await pusher.trigger(`private-${sender._id}`, 'messagesUpdate', {updatedMessages:updatedChat.messages});


        return Response.json({
            success: true,
            message: "Message sent successfully",
            updatedMessages:updatedChat.messages
        }, { status: 200 });
    } catch (error) {
        console.error("Error sending message:", error);

        return Response.json({
            success: false,
            message: "Problem sending message"
        }, { status: 500 });
    }
}

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
        const { message, chatId } = await request.json();
        const recipient = await User.findById(chatId);
        const sender = await User.findById(_user._id);

        let chat = await Chat.findOne({
            participants: { $all: [sender._id, recipient._id] }
        });

        if (!chat) {
            chat = new Chat({ participants: [sender._id, recipient._id] });
        }

       
        const notificationIndex = recipient.newMsgNotificationDot.findIndex(
            (notification) => notification.Id.toString() === sender._id.toString()
        );

        if (notificationIndex !== -1) {
           
            recipient.newMsgNotificationDot[notificationIndex].count += 1;
        } else {
           
            recipient.newMsgNotificationDot.push({
                Id: sender._id,
                count: 1
            });
        }

        await recipient.save();

        chat.messages.push({ sender: sender._id, content: message });
        await chat.save();

        // Trigger the Pusher event for real-time updates
        await pusher.trigger(`private-${chatId}`, 'newmsg', { message });
        await pusher.trigger(`private-${chatId}`, 'newMsgNotificationDot', {
            Id: sender._id
        });

        return Response.json({
            success: true,
            message: "Message sent successfully"
        }, { status: 200 });
    } catch (error) {
        console.error("Error sending message:", error);

        return Response.json({
            success: false,
            message: "Problem sending message"
        }, { status: 500 });
    }
}

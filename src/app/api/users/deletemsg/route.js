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
        const { chatId, msgId } = await request.json();
       

        const isChat = await Chat.findById(chatId);
        if (isChat) {

            let uniqueChatId = isChat._id.toString()
            // Trigger the Pusher event for real-time updates
            await pusher.trigger(`private-${uniqueChatId}`, 'messagesDelete', { msgId });
            const updatedMessages = isChat.messages.filter((message) => message._id.toString() !== msgId.toString());

            // Update chat with the modified messages
            isChat.messages = updatedMessages;
            await isChat.save()

        } else {
            const recipient = await User.findById(chatId);
            const sender = await User.findById(_user._id);
            if (recipient.isMyChatOpen.toString() !== sender._id.toString()) {

                await pusher.trigger(`private-${chatId}`, 'newMsgNotificationDot', {
                    Id: sender._id,
                    decrement: true
                });

            }
            let chat = await Chat.findOne({
                participants: { $all: [sender._id, recipient._id] }
            });


            if (!chat) {
                return Response.json({
                    success: true,
                    message: "no message found for delete message"
                }, { status: 400 });
            }
            let uniqueChatId = chat._id.toString()
            // Trigger the Pusher event for real-time updates
            await pusher.trigger(`private-${uniqueChatId}`, 'messagesDelete', { msgId });
            const updatedMessages = chat.messages.filter((message) => message._id.toString() !== msgId.toString());

            // Update chat with the modified messages
            chat.messages = updatedMessages;
            await chat.save()

            if (recipient.newMsgNotificationDot.length > 0) {
                recipient.newMsgNotificationDot.forEach((notification, index) => {
                    if (notification.Id === sender._id) {
                        if (notification.count === 1) {
                            // Remove the object from the array
                            recipient.newMsgNotificationDot.splice(index, 1);
                        } else {
                            // Increment the count
                            notification.count -= 1;
                        }

                    }
                });
            }
            await recipient.save()

        }

        return Response.json({
            success: true,
            message: "Message delete successfully",
        }, { status: 200 });
    } catch (error) {
        console.error("Error delete message:", error);

        return Response.json({
            success: false,
            message: "Problem delete message"
        }, { status: 500 });
    }
}

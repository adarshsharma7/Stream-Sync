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
        const { message, chatId, msgStatus } = await request.json();

        await dbConnect();

        const sender = await User.findById(_user._id);
        const chat = await Chat.findById(chatId);


        if (chat) {
            // Handle group chat
            let ab = chat.messages.push({ sender: _user._id, msgStatus, content: message });
            await chat.save();

            // Notify all participants of the group chat

            let uniqueChatId = chat._id.toString()
            pusher.trigger(`private-${uniqueChatId}`, 'newmsg', { message, msgSenderId: _user._id, username: sender.username });


            for (let participantId of chat.participants) {
                const recipient = await User.findById(participantId);

                // Check if recipient's isMyChatOpen doesn't match the chatId
                if (recipient.isMyChatOpen.toString() !== uniqueChatId) {
                    // Find or update notification for that recipient
                    const notificationIndex = recipient.newMsgNotificationDot.findIndex(
                        (notification) => notification.Id.toString() === uniqueChatId
                    );

                    if (notificationIndex !== -1) {
                        // Update the count if notification exists
                        recipient.newMsgNotificationDot[notificationIndex].count += 1;
                    } else {
                        // Add a new notification object if it doesn't exist
                        recipient.newMsgNotificationDot.push({
                            Id:uniqueChatId ,
                            count: 1
                        });
                    }

                    // Save the recipient with updated notification
                    await recipient.save();

                    // Trigger Pusher notification for this recipient
                    await pusher.trigger(`private-${recipient._id}`, 'newMsgNotificationDot', {
                        Id: uniqueChatId
                    });
                }
            }


            return Response.json({
                success: true,
                message: "Message sent successfully to group",
                msgId: chat.messages[ab - 1]._id,
            }, { status: 200 });

        } else {
            const recipient = await User.findById(chatId);


            let chat = await Chat.findOne({
                participants: { $all: [sender._id, recipient._id] }
            });

            if (!chat) {
                chat = new Chat({ participants: [sender._id, recipient._id] });
            }
            // Trigger the Pusher event for real-time updates
            let uniqueChatId = chat._id.toString()
            await pusher.trigger(`private-${uniqueChatId}`, 'newmsg', { message, msgSenderId: sender._id, username: sender.username });




            if (recipient.isMyChatOpen.toString() !== sender._id.toString()) {

                const notificationIndex = recipient.newMsgNotificationDot.findIndex(
                    (notification) => notification.Id.toString() === sender._id.toString()
                );


                if (notificationIndex !== -1) {
                    // Update the count if notification exists
                    recipient.newMsgNotificationDot[notificationIndex].count += 1;
                } else {
                    // Add a new notification object if it doesn't exist
                    recipient.newMsgNotificationDot.push({
                        Id: sender._id,
                        count: 1
                    });
                }

                await recipient.save();
                await pusher.trigger(`private-${chatId}`, 'newMsgNotificationDot', {
                    Id: sender._id
                });
            }


            let ab = chat.messages.push({ sender: sender._id, msgStatus, content: message });
            await chat.save();


            return Response.json({
                success: true,
                message: "Message sent successfully",
                msgId: chat.messages[ab - 1]._id,
            }, { status: 200 });

        }
    } catch (error) {
        console.error("Error sending message:", error);

        return Response.json({
            success: false,
            message: "Problem sending message"
        }, { status: 500 });
    }
}

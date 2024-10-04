import { dbConnect } from '@/dbConfig/dbConfig';
import Chat from '@/models/chat.models';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import Pusher from 'pusher';
import { log } from 'console';

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
        const { message, replyMsg, chatId, msgStatus, videoData } = await request.json();
        console.log("replyMsg",replyMsg);
        


        await dbConnect();

        const sender = await User.findById(_user._id);
        const chat = await Chat.findById(chatId);

        const HandleGroupChat = async (chat, isLink) => {
            let ab = chat.messages.push({ sender: _user._id, msgStatus, content: message, videoData, repliedContent:replyMsg });
            await chat.save();

            // Notify all participants of the group chat

            let uniqueChatId = chat._id.toString()
            pusher.trigger(`private-${uniqueChatId}`, 'newmsg', { message, msgSenderId: _user._id, username: sender.username, videoData, replyMsg });


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
                            Id: uniqueChatId,
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
            if (!isLink) {
                return {
                    success: true,
                    message: "Message sent successfully",
                    msgId: chat.messages[ab - 1]._id,
                }
            }
        }

        const HandleIndivisualChat = async (chatid, isLink) => {
            const recipient = await User.findById(chatid);


            let chat = await Chat.findOne({
                participants: { $all: [sender._id, recipient._id] }
            });

            if (!chat) {
                chat = new Chat({ participants: [sender._id, recipient._id] });
            }
            // Trigger the Pusher event for real-time updates
            let uniqueChatId = chat._id.toString()
            await pusher.trigger(`private-${uniqueChatId}`, 'newmsg', { message, msgSenderId: sender._id, username: sender.username, videoData, replyMsg });




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
                await pusher.trigger(`private-${chatid}`, 'newMsgNotificationDot', {
                    Id: sender._id
                });
            }


            let ab = chat.messages.push({ sender: sender._id, msgStatus, content: message, videoData, repliedContent:replyMsg });
            await chat.save();

            if (!isLink) {
                return {
                    success: true,
                    message: "Message sent successfully",
                    msgId: chat.messages[ab - 1]._id,
                }
            }

        }

        if (Array.isArray(chatId)) {
            for (let val of chatId) {

                const chat = await Chat.findById(val);

                if (chat) {

                    await HandleGroupChat(chat, true);
                } else {

                    await HandleIndivisualChat(val, true);
                }
            }
            return Response.json({
                success: true,
                message: "Messages processed for all chatIds",
            }, { status: 200 });
        } else if (chat) {

            const obj = await HandleGroupChat(chat, false);
            return Response.json(obj, { status: 200 })
        } else {

            const obj = await HandleIndivisualChat(chatId, false);
            return Response.json(obj, { status: 200 })
        }


    } catch (error) {
        console.error("Error sending message:", error);

        return Response.json({
            success: false,
            message: "Problem sending message"
        }, { status: 500 });
    }
}

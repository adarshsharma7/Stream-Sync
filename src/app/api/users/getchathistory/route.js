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

export async function GET(request) {
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
        
        // Parse the URL to get the query parameters
        const url = new URL(request.url);
        const chatId = url.searchParams.get('chatId');  // Can be either user chat ID or group chat ID
        if (!chatId) {
            return Response.json({
                success: false,
                message: "Chat ID not provided"
            }, { status: 400 });
        }

        const sender = await User.findById(_user._id);
        const recipient = await User.findById(chatId);
        const isChat = await Chat.findById(chatId);

        let chat;
        console.log("wch" , chatId);
        
  
        // Check if the chatId is for a group chat or a one-on-one chat
        if (isChat) {  // Assume group chats have an identifier like "group123"
            // Handle group chat
            chat = await Chat.findById(chatId).populate('messages.sender', 'username');
            if (chat.messages.length==0) {
                return Response.json({
                    success: false,
                    message: "No group chat history found"
                }, { status: 200 });
            }

        } else {
            // Handle one-on-one chat
            if (!recipient) {
                return Response.json({
                    success: false,
                    message: "Recipient not found"
                }, { status: 400 });
            }

            chat = await Chat.findOne({
                participants: { $all: [sender._id, recipient._id] }
            }).populate('messages.sender', 'username');

            if (!chat) {
                return Response.json({
                    success: false,
                    message: "No chat history found"
                }, { status: 200 });
            }
            
            await pusher.trigger(`private-${sender._id}`, 'inChatUpdate', { isMyChatOpen: recipient.isMyChatOpen });
        }

        return Response.json({
            success: true,
            chatHistory: chat.messages,
            uniqueChatId: chat._id,
            isGroup :isChat ? true : false,
            isMyChatOpen: isChat ? null : recipient.isMyChatOpen // Group chats don't have `isMyChatOpen`
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chat history:", error);

        return Response.json({
            success: false,
            message: "Problem fetching chat history"
        }, { status: 500 });
    }
}

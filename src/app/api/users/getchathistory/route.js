import { dbConnect } from '@/dbConfig/dbConfig';
import Chat from '@/models/chat.models';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";


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
        const chatId = url.searchParams.get('chatId');
        if (!chatId) {
            return Response.json({
                success: false,
                message: "Chat ID not provided"
            }, { status: 400 });
        }

        const recipient = await User.findById(chatId);
        const sender = await User.findById(_user._id);

        const chat = await Chat.findOne({
            participants: { $all: [sender._id, recipient._id] }
        }).populate('messages.sender', 'username');

        if (!chat) {
            return Response.json({
                success: false,
                message: "No chat history found"
            }, { status: 404 });
        }
    
        

        return Response.json({
            success: true,
            chatHistory: chat.messages
        }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chat history:", error);

        return Response.json({
            success: false,
            message: "Problem fetching chat history"
        }, { status: 500 });
    }
}

import { dbConnect } from '@/dbConfig/dbConfig';
import Chat from '@/models/chat.models';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";


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
        const { chatId } = await request.json()
        if (!chatId) {
            return Response.json({
                success: false,
                message: "Chat ID not provided"
            }, { status: 400 });
        }


        const updatedUser = await User.findOneAndUpdate(
            { _id: _user._id },
            {
                $pull: { newMsgNotificationDot: { Id: chatId } },
                $set: { isMyChatOpen: chatId }
            },
            { new: true }  
        );
        

        return Response.json({
            success: true,
            isNewMsgNotification: updatedUser.newMsgNotificationDot,
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

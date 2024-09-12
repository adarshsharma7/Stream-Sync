import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { Notifications } from "@/models/notifications.models"
import Pusher from 'pusher';
import Chat from '@/models/chat.models';

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
        const { chatId, deleteGroup } = await request.json()
        let recipent = await User.findById(chatId)
        let user = await User.findById(_user._id)

        const isChat = await Chat.findById(chatId);
        if (deleteGroup) {
            await User.updateOne({ _id: user._id }, { $pull: { group: { groupId: isChat._id } } }, { new: true });
            const participantUpdates = isChat.participants.map(async (participantId) => {
                const recipient = await User.findById(participantId);
                await User.updateOne(
                    { _id: recipient._id },
                    { $pull: { group: { groupId: isChat._id } } }, { new: true }// Pull user._id from members array of that group
                );

                // Trigger a Pusher event to notify the participants
                await pusher.trigger(`private-${recipient._id}`, 'removeFrnd', {
                    removeGroupFrndId: isChat._id,
                    deleteGroup: true
                });
            });
            await Promise.all(participantUpdates);

            await Chat.findByIdAndDelete(chatId);
            let updatedUser = await User.findById(_user._id)


            return Response.json({
                success: true,
                message: "done",
                chatData: updatedUser.chatfrnd,
                groupData: updatedUser.group
            }, { status: 200 });

        }

        else if (isChat) {
            let uniqueChatId = isChat._id.toString();

            // Remove the user from the chat participants list
            await Chat.updateOne({ _id: isChat._id }, { $pull: { participants: user._id } });

            // Remove the chat group from the user's group list
            await User.updateOne({ _id: user._id }, { $pull: { group: { groupId: isChat._id } } }, { new: true });

            // Update all other participants concurrently
            const participantUpdates = isChat.participants.map(async (participantId) => {
                const recipient = await User.findById(participantId);
                await User.updateOne(
                    { _id: recipient._id, "group.groupId": isChat._id },
                    { $pull: { "group.$.members": user._id } } // Pull user._id from members array of that group
                );

                // Trigger a Pusher event to notify the participants
                await pusher.trigger(`private-${recipient._id}`, 'removeFrnd', {
                    removeGroupFrndId: uniqueChatId,
                    removeFrndId: user._id
                });
            });

            await Promise.all(participantUpdates); // Wait for all updates to complete
            let updatedUser = await User.findById(_user._id)
            return Response.json({
                success: true,
                message: "done",
                chatData: updatedUser.chatfrnd,
                groupData: updatedUser.group

            }, { status: 200 });

        }
        else {

            await User.updateOne({ _id: recipent._id }, { $pull: { chatfrnd: user._id } })
            await User.updateOne({ _id: user._id }, { $pull: { chatfrnd: recipent._id } }, { new: true })



            let notifi = await Notifications.create({
                msg: "remove",
                owner: user._id
            })
            await pusher.trigger(`private-${recipent._id}`, 'removeFrnd', {
                notificationId: notifi._id,
                username: user.username,
                avatar: user.avatar,
                Id: user._id,
                isDot: recipent.isNotificationBoxOpen ? false : true

            });

            let updatedUser = await User.findById(_user._id)
            return Response.json({
                success: true,
                message: "done",
                chatData: updatedUser.chatfrnd,
                groupData: updatedUser.group

            }, { status: 200 });
        }


    } catch (error) {
        console.error("Error fetching chat history:", error);

        return Response.json({
            success: false,
            message: "Problem fetching chat history"
        }, { status: 500 });
    }
}

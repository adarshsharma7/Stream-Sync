import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import Pusher from 'pusher';
import User from '@/models/userModel';

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
});

export async function POST(req) {
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: "Not Authenticated"
        }, { status: 401 });
    }

    try {
        // Parse the request body as form data
        const formData = await req.formData();
        const socketId = formData.get('socket_id');
        const channelName = formData.get('channel_name');
        let user = await User.findById(_user._id)
        // Generate the authentication signature
        const auth = pusher.authenticate(socketId, channelName, {
            user_id: user._id, // Optionally include more user info
            user_info: {
                username: user.username
            }
        });

        return NextResponse.json(auth);
    } catch (error) {
        console.error("Pusher Auth Error:", error);
        return NextResponse.json({
            success: false,
            message: "Pusher Authentication Failed"
        }, { status: 500 });
    }
}

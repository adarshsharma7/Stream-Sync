import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import Pusher from 'pusher';
import User from '@/models/userModel';


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
        const { username, isDel, isEmpty,isNotificationBoxClose } = await req.json()
        let user = await User.findById(_user._id)
      
        if (isEmpty) {
            user.isNotificationBoxOpen=true
            user.isNewNotification = []
        }else if(isNotificationBoxClose){
            user.isNotificationBoxOpen=false

        } else if (isDel) {
            await User.updateOne({ _id: _user._id }, { $pull: { isNewNotification: username } })
        } else {
            user.isNewNotification.push(username)
        }
        await user.save()

        return NextResponse.json({
            success: true,
            message: "hogaya"
        }, { status: 200 });

    } catch (error) {
        console.log(error);

        return NextResponse.json({
            success: false,
            message: "kuch galt"
        }, { status: 500 });
    }
}
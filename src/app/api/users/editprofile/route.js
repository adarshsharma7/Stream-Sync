import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: "Not Authenticated"
        }, { status: 400 });
    }

    try {
         
        await dbConnect();

        const { username, fullName, avatar, currentPassword, newPassword } = await request.json();
        let payload = {};
        let updatedPassword = false;

        // Handle Password Update
        if (currentPassword && newPassword) {
            let user = await User.findById(_user._id);
            let isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

            if (!isPasswordCorrect) {
                return NextResponse.json({
                    success: false,
                    message: 'Current password is incorrect',
                }, { status: 200 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            payload.password = hashedPassword;
            updatedPassword = true;
        }

        // Handle Profile Update
        if (username || fullName || avatar) {
            if (avatar) {
                const token = process.env.BLOB_READ_WRITE_TOKEN;
                const jsonResponse = await handleUpload({
                    body: { avatar },
                    request,
                    token
                    onUploadCompleted: async ({ blob }) => {
                        payload.avatar = blob.url;
                    },
                });
            }
            console.log("json response",jsonResponse)
            if (username) payload.username = username;
            if (fullName) payload.fullName = fullName;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: _user._id },
            payload,
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: updatedPassword ? 'Password updated successfully!' : 'User updated successfully!',
            updatedUser,
        }, { status: 201 });

    } catch (error) {
        console.error("Problem Updating:", error);
        return NextResponse.json({
            success: false,
            message: 'Update failed'
        }, { status: 500 });
    }
}

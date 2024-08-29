import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { sendVerificationEmail } from '@/helper/sendVerificationCode';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { uploadOnCloudinary } from '@/utils/cloudinary';
import { NextResponse } from 'next/server';


export async function POST(request) {
    const session = await getServerSession(authOptions)
    const _user = session?.user
    if (!_user || !session) {
        return Response.json({
            success: false,
            message: "Not Authenticated"
        }, { status: 400 })
    }


    try {
        await dbConnect();

        let data = await request.formData();
        let username = data.get("username");
        let fullName = data.get("fullName");
        let avatar = data.get("avatar");
      
        

        if (!username && !fullName && !avatar) {
            return NextResponse.json({
                success: false,
                message: "One field required"
            }, { status: 400 });
        }
        let payload = {}

        if (avatar && typeof avatar === 'object' && avatar.size > 0) {
            const avatarResponse = await uploadOnCloudinary(avatar);
            if (!avatarResponse || !avatarResponse.url) {
                return NextResponse.json({
                    success: false,
                    message: "Upload failed"
                }, { status: 500 });
            }
            payload.avatar = avatarResponse.url

        }
        if (username) {
            payload.username = username
        }
        if (fullName) {
            payload.fullName = fullName
        }



        const updatedUser = await User.findOneAndUpdate(
            { _id: _user._id }, // Assuming you're identifying the user by their ID
            payload,
            { new: true }
        );
        if (updatedUser) {
            console.log("User updated successfully!");
            return NextResponse.json({
                success: true,
                message: 'User updated successfully!',
                updatedUser: updatedUser,
            }, { status: 201 });
        } else {
            console.log("User update failed or no changes were made.");
            return NextResponse.json({
                success: false,
                message: 'User update failed or no changes were made.'
            }, { status: 500 });
        }



    } catch (error) {
        console.log("Problem Updating:", error);
        return NextResponse.json({
            success: false,
            message: 'Updation failed'
        }, { status: 500 });
    }
}

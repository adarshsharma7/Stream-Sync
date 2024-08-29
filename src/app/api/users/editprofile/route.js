import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { uploadOnCloudinary } from '@/utils/cloudinary';


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

        let data = await request.formData();
        let username = data.get("username");
        let fullName = data.get("fullName");
        let avatar = data.get("avatar");
        let currentPassword = data.get("currentPassword");
        let newPassword = data.get("newPassword");
        let isPass = data.get("isPass");
        let isProf = data.get("isProf");
        console.log(data);
        

        let payload = {};
        let updatedPassword = false;

        if (isPass) {
            if (!currentPassword || !newPassword || !(currentPassword && newPassword)) {
                return Response.json({
                    success: false,
                    message: "Both fields are required"
                }, { status: 200 });
            }
           let user=await User.findById(_user._id)
            let isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return Response.json({
                    success: false,
                    message: 'Current password is incorrect',
                }, { status: 200 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            payload.password = hashedPassword;
            updatedPassword = true;
        }

        if (isProf) {
            if (!username && !fullName && !avatar) {
                return Response.json({
                    success: false,
                    message: "At least one field is required for profile update"
                }, { status: 200 });
            }

            if (avatar && typeof avatar === 'object' && avatar.size > 0) {
                const avatarResponse = await uploadOnCloudinary(avatar);
                if (!avatarResponse || !avatarResponse.url) {
                    return Response.json({
                        success: false,
                        message: "Upload failed"
                    }, { status: 500 });
                }
                payload.avatar = avatarResponse.url;
            }

            if (username) payload.username = username;
            if (fullName) payload.fullName = fullName;
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id: _user._id },
            payload,
            { new: true }
        );

        let response = {
            success: true,
            message: updatedPassword ? 'Password updated successfully!' : 'User updated successfully!'
        };

        if (!updatedPassword) {
            response.updatedUser = updatedUser;
        }

        return Response.json(response, { status: 201 });

    } catch (error) {
        console.log("Problem Updating:", error);
        return Response.json({
            success: false,
            message: 'Update failed'
        }, { status: 500 });
    }
}

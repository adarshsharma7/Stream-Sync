import { dbConnect } from "@/dbConfig/dbConfig"
import { sendVerificationEmail } from "@/helper/sendVerificationCode"
import User from "@/models/userModel"
import bcrypt from 'bcryptjs'
import { uploadOnCloudinary } from '@/utils/cloudinary';


export async function POST(request) {
    dbConnect()
    try {
        const { username, email, password, fullName, avatar } = await request.json();

        const avatarFileName = `avatar_${Date.now()}.jpg`;

        const user = await User.findOne({ email })
        const isUsername = await User.findOne({ username })
        const hashedPassword = await bcrypt.hash(password, 10)
        if (user && user.isVerified) {
            return Response.json({
                message: "Email is aready Exist",
                success: false
            }, { status: 400 })
        }

        
        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (user) {
            return Response.json({
                message: "Email is aready Exist",
                success: false
            }, { status: 400 })
        }

        else if (isUsername) {
            return Response.json({
                message: "Username is aready Exist",
                success: false
            }, { status: 400 })
        }
        else {
            const avatarResponse = await uploadOnCloudinary(avatar, avatarFileName);
            if (!avatarResponse || !avatarResponse.url) {
                return Response.json({
                    message: "Problem uploading image",
                    success: false
                }, { status: 500 })
            }
        }
        let newUser = await User.create({
            fullName,
            username,
            email,
            avatar: avatarResponse.url,
            password: hashedPassword,
            verifyCode: verifyCode,
            verifyCodeExpiry: new Date(Date.now() + 3600000),

        })

        const result = await sendVerificationEmail(email, username, verifyCode)
        if (!result.success) {
            return Response.json(
                {
                    success: false,
                    message: `Error sending verification code ${result.message}`,
                },
                { status: 500 }
            )
        }
        return Response.json(
            {
                success: true,
                message: 'User registered successfully. Please verify your account.',
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error registering user:', error);
        return Response.json(
            {
                success: false,
                message: 'Error registering user',
            },
            { status: 500 }
        )
    }

}

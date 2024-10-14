import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { sendVerificationEmail } from '@/helper/sendVerificationCode';
import bcrypt from 'bcryptjs';
import { uploadOnCloudinary } from '@/utils/cloudinary';
import { NextResponse } from 'next/server';


export async function POST(request) {
  await dbConnect();
  
  try {
    let data = await request.formData();
    let username = data.get("username");
    let password = data.get("password");
    let email = data.get("email");
    let fullName = data.get("fullName");
    let avatar = data.get("avatar");

    if ([username, password, email, fullName, avatar].some(field => !field)) {
      return NextResponse.json({
        success: false,
        message: "All fields are required"
      }, { status: 400 });
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
      return NextResponse.json({
        success: false,
        message: "Email already exists"
      }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Upload file to Cloudinary
    
    
    const avatarResponse = await uploadOnCloudinary(avatar);
    
    if (!avatarResponse || !avatarResponse.url) {
      return NextResponse.json({
        success: false,
        message: "Upload failed"
      }, { status: 500 });
    }

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      verifyCode,
      verifyCodeExpiry: new Date(Date.now() + 3600000),
      avatar: avatarResponse.url,
    });

    const result = await sendVerificationEmail(email, username, verifyCode);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: `Error sending verification code: ${result.message}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully. Please verify your account.'
    }, { status: 201 });

  } catch (error) {
    console.log("Problem registering:", error);
    return NextResponse.json({
      success: false,
      message: 'Registration failed'
    }, { status: 500 });
  }
}

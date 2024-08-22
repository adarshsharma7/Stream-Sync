import { dbConnect } from "@/dbConfig/dbConfig"
import User from "@/models/userModel"
import {sendVerificationEmail} from "@/helper/sendVerificationCode"
import bcrypt from 'bcryptjs'

 export async function POST(request){
  await dbConnect()
  const { username, password, fullName, email } =await request.json()

  if ([username, password, email, fullName].some((field) => field?.trim() == "")) {
   return Response.json({
    success:false,
    message:"All feilds required"
   },{status:400})
  }
  const existedUser = await User.findOne({email})
  if (existedUser) {
    return Response.json({
      success:false,
      message:"User already exist with this Email"
     },{status:400})
  }
  // console.log(req.files);
  const hashedPassword = await bcrypt.hash(password, 10)
  let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    username: username,
    email,
    password:hashedPassword,
    fullName,
    verifyCode: verifyCode,
    verifyCodeExpiry: new Date(Date.now() + 3600000),
    avatar:""
   
  })
  const result= await sendVerificationEmail(email,username,verifyCode)
  if(!result.success){
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

  return Response.json({
    success:true,
    message:"User Registered"
   },{status:200})
 
 
 }
 
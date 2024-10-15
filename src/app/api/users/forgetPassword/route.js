import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { ForgetPasswordVerification } from '@/helper/ForgetPassword';
import bcrypt from 'bcryptjs';

export async function POST(req){
    try {
        await dbConnect();
        const {credential}=await req.json()
        
        const existedUser = await User.findOne({ $or: [{ username:credential }, { email:credential }]})
        if(!existedUser){
            return Response.json({
                success: false,
                message: "Email or Username not Exist"
            }, { status: 400 });
        }
        if(existedUser.forgetPasswordTokenExpiry>Date.now() ){
          return Response.json({
            success: false,
            message: "Email is already sent for change password"
        }, { status: 200 });
        }
        let hashedToken = await bcrypt.hash(existedUser._id?.toString(), 10);
        existedUser.forgetPasswordToken=hashedToken
        existedUser.forgetPasswordTokenExpiry=Date.now() + 3600000 
        await existedUser.save()

        const result = await ForgetPasswordVerification(existedUser.email, existedUser.username, hashedToken);
        if (!result.success) {
          return Response.json({
            success: false,
            message: `Error sending verification code: ${result.message}`
          }, { status: 500 });
        }
        return Response.json({
          success: true,
          message: `Email sent for forget password`
        }, { status: 200 });
    
    } catch (error) {
      console.log("something error in forget password backend",error);
      
      return Response.json({
        success: false,
        message: `Error sending verification code: `
      }, { status: 500 });
    }
}
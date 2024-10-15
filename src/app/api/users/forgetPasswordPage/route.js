import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import bcrypt from 'bcryptjs';
export async function POST(req) {

    try {
        await dbConnect()
        const { token, password } = await req.json();

        // Find the user by forgetPasswordToken
        let user = await User.findOne({ forgetPasswordToken: token });

        if (!user) {
            return Response.json({
                success: false,
               message: "Password link is Expired Or Invalid"
            }, { status: 200 });
          
        }

        // Update the user's password and reset the forgetPasswordToken fields
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.forgetPasswordToken = undefined;
        user.forgetPasswordTokenExpiry = undefined;

        await user.save();
        return Response.json({
            success: true,
          message: "Password is reset successfully"
        }, { status: 200 });
      

      

    } catch (error) {
      
        return Response.json({ success:false,message: "Internal Server Error", error: error.message },{status:500});
    } 
}

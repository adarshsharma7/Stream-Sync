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
            return Response.status(400).json({ message: "Password link is Expired Or Invalid" });
        }

        // Update the user's password and reset the forgetPasswordToken fields
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.forgetPasswordToken = undefined;
        user.forgetPasswordTokenExpiry = undefined;

        await user.save();

        return Response.status(200).json({ message: "Password is reset successfully" });

    } catch (error) {
        return Response.status(500).json({ message: "Internal Server Error", error: error.message });
    } 
}

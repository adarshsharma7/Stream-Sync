import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs'
import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { sendVerificationEmail } from '@/helper/sendVerificationCode';

export const authOptions={
providers:[
    CredentialsProvider({
        id:"credentials",
        name: "Credentials",
        credentials: {
            username: { label: "Username", type: "text"},
            password: { label: "Password", type: "password" }
          },
          async authorize(credentials){
            await dbConnect()
            try {
                const user=await User.findOne({
                    $or:[{email:credentials.identifier},{username:credentials.identifier}]
                })
                if(!user){
                    throw new Error('No user found');
                }
                if(!user.isVerified){
                  let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
                  const result = await sendVerificationEmail(user.email, user.username, verifyCode);
                     if (!result.success) {   
                      throw new Error(`Error sending verification code: ${result.message}`);     
                     }
                     user.verifyCode=verifyCode,
                     user.verifyCodeExpiry=new Date(Date.now() + 3600000),
                     await user.save()

                    throw new Error('Please verify your account before login');
                }
                const isPasswordCorrect=await bcrypt.compare(credentials.password,user.password)
                   if(!isPasswordCorrect){
                    throw new Error('Password is incorrect');
                   }
                   return user;
            } catch (error) {
                throw new Error(error);
            }
          },

    }),
   
],
callbacks:{
    async jwt({ token,user}) {
        if(user){
            token._id=user._id?.toString();
            token.isVerified=user.isVerified
            token.username=user.username;
            token.avatar=user.avatar;

        }
        return token
      },
    async session({ session, token }) {
        if(token){
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.username = token.username;
        session.user.avatar = token.avatar;
        }
        return session
      }
     
},
session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
}



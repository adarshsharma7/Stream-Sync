import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel"
import verifyonsignup from "@/models/verifyEmailModel.js"
import {NextRequest,NextResponse} from 'next/server'
import bcrypt from 'bcryptjs'
import { sendEmail } from "@/utils/mailer";
import { ApiError } from "next/dist/server/api-utils";


connect()

export async function POST(request:NextRequest){
  try {
    
      const {email}=await request.json()
      const user=await User.findOne({email:email})
      const verifySignupUser=await verifyonsignup.findOne({email:email})
      if(verifySignupUser){
        return NextResponse.json({alreadyemailerror:"A email is already sent on your email address",userId:verifySignupUser._id,isVarified:verifySignupUser.isvarified})
    }
      
      if(user){
          return NextResponse.json({error:"email is already exists"})
      }
      
     const newUser= await verifyonsignup.create({
          email:email
      })
     
      
      await sendEmail ({email,emailType:'VERIFY',userId:newUser._id,verifyemailonsignup:true})
      return NextResponse.json({message:"email sent successfull",userId:newUser._id})
  } catch (error) {
    return NextResponse.json({error:"something went wrong",status:500}) 
  }

}

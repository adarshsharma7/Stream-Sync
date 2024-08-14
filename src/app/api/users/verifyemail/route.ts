
import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel"
import verifyonsignup from "@/models/verifyEmailModel";
import {NextRequest,NextResponse} from 'next/server'


// export async function POST(req:NextRequest){
//   try {
//       const reqBody=await req.json()
//       const {token}=reqBody
  
//      const user= await User.findOne({verifyToken:token,verifyTokenExpiry:{$gt:Date.now()}})
//      if(!user){
//         return NextResponse.json({error:"invalid link or link is expired"},{status:400})
//      }
//       user.isvarified=true
//       user.verifyToken=undefined
//      user.verifyTokenExpiry=undefined
//      await user.save()
//      return NextResponse.json({message:"email verified successfully",succes:true},{status:200,})
//   } catch (error:any) {
//     return NextResponse.json({error:error.message},{status:500})
//   }
// }
export async function POST(req:NextRequest){
  await dbConnect()
  
  try {
    const reqBody=await req.json()
           const {token}=reqBody
           const user= await verifyonsignup.findOne({verifyToken:token,verifyTokenExpiry:{$gt:Date.now()}})
                 if(!user){
                   return NextResponse.json({error:"invalid link or link is expired"},{status:400})
                 }
                 user.isvarified=true
                 user.verifyToken=undefined
                 user.verifyTokenExpiry=undefined
                 await user.save()
                 return NextResponse.json({message:"email verified successfully",succes:true,isVarified:user.isvarified},{status:200,})

  } catch (error:any) {
    return NextResponse.json({error:error.message},{status:500})
  }
}


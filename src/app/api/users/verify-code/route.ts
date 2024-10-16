
import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";

import { verifySchema } from "@/Schemas/verifySchema";


export async function POST(request: Request) {
  await dbConnect()
  try {
    const { username, code } = await request.json()
    let result = verifySchema.safeParse({ code })

    if (!result.success) {
      const codeErrors = result.error.format().code?._errors || [];
      return Response.json(
        {
          success: false,
          message:
            codeErrors?.length > 0
              ? codeErrors.join(', ')
              : 'Invalid query parameters',
        },
        { status: 400 }
      );
    }
    let user = await User.findOne({
      $or: [{ username: username }, { email: username }]
    })
    
    if (!user) {
      return Response.json(
        {
          success: false,
          message: "user not found"
        },
        { status: 400 }
      );
    }
    let isCodeCorrect = code == user.verifyCode
    let isCodeExpired = new Date(user.verifyCodeExpiry) > new Date()
    if (!isCodeCorrect) {
      return Response.json(
        {
          success: false,
          message: "Verification Code is incorrect"
        },
        { status: 400 }
      );
    } else if (!isCodeExpired) {
      return Response.json(
        {
          success: false,
          message: "Verification Code is Expired"
        },
        { status: 400 }
      );
    } else {
      user.isVerified = true
      user.verifyCode = null
      user.verifyCodeExpiry = null
      await user.save()

      return Response.json(
        {
          success: true,
          message: "Verification successfully"
        },
        { status: 200 }
      );
    }

  } catch (error) {
    console.error('Error verifying user:', error);
    return Response.json(
      { success: false, message: 'Error verifying user' },
      { status: 500 }
    );
  }

}

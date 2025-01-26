import { NextResponse } from 'next/server';
import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { usernameSchemaType } from "@/Schemas/signUpSchemas";

export const dynamic = 'force-dynamic'; // Ensure dynamic runtime

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) {
      return NextResponse.json({
        success: false,
        message: "Username is required",
      }, { status: 400 });
    }

    const usernameToken = { username };
    let result = usernameSchemaType.safeParse(usernameToken);
    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return NextResponse.json({
        success: false,
        message:
          usernameErrors.length > 0
            ? usernameErrors.join(', ')
            : 'Invalid query parameters',
      }, { status: 400 });
    }

    let user = await User.findOne({ username, isVerified: true });
    if (user) {
      return NextResponse.json({
        success: false,
        message: "Username not available",
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Username is available",
    }, { status: 200 });

  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking username',
    }, { status: 500 });
  }
}

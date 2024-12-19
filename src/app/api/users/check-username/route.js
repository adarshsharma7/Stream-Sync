import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { usernameSchemaType } from "@/Schemas/signUpSchemas";

// Set the runtime for the API route
//  export const runtime = 'edge';

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const usernameToken = {
      username: searchParams.get("username"),
    };
    let result = usernameSchemaType.safeParse(usernameToken);
    if (!result.success) {
      const usernameErrors = result.error.format().username?._errors || [];
      return Response.json({
        success: false,
        message:
        usernameErrors?.length > 0
          ? usernameErrors.join(', ')
          : 'Invalid query parameters',
    }, { status: 400 });
    }
    let { username } = result.data;
    let user = await User.findOne({ username, isVerified: true });
    if (user) {
      return Response.json({
        success: false,
        message: "Username not available"
    }, { status: 400 });
    }
    return Response.json({
      success: true,
       message: "Username is available"
  }, { status: 200 });
   
  } catch (error) {
    console.error('Error checking username:', error);
    return Response.json({
      success: false,
       message: 'Error checking username'
  }, { status: 500 });
  }
}

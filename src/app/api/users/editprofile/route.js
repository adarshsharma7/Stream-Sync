import { handleUpload } from '@vercel/blob/client';
import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const _user = session?.user;
  if (!_user || !session) {
    return Response.json({
      success: false,
      message: "Not Authenticated"
    }, { status: 400 });
  }

  try {
    await dbConnect();
    const data = await request.formData();
    const username = data.get("username");
    const fullName = data.get("fullName");
    const currentPassword = data.get("currentPassword");
    const newPassword = data.get("newPassword");
    const isPass = data.get("isPass");
    const isProf = data.get("isProf");
    let payload = {};
    let updatedPassword = false;

    if (isPass) {
      // Password update logic
    }

    if (isProf) {
      if (!username && !fullName) {
        return Response.json({
          success: false,
          message: "At least one field is required for profile update"
        }, { status: 200 });
      }

      const jsonResponse = await handleUpload({
        body: data, 
        request,
        onBeforeGenerateToken: async (pathname) => {
          return {
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
            tokenPayload: JSON.stringify({ /* custom payload if needed */ }),
          };
        },
        onUploadCompleted: async ({ blob }) => {
          if (blob && blob.url) {
            payload.avatar = blob.url;  // Save blob URL to user data
          }
        },
      });
      console.log("jsonResponse" ,jsonResponse);
      

      if (username) payload.username = username;
      if (fullName) payload.fullName = fullName;
    }

    const updatedUser = await User.findOneAndUpdate({ _id: _user._id }, payload, { new: true });
    return Response.json({
      success: true,
      message: updatedPassword ? 'Password updated successfully!' : 'User updated successfully!',
      updatedUser,
    }, { status: 201 });

  } catch (error) {
    console.error("Problem Updating:", error);
    return Response.json({
      success: false,
      message: 'Update failed'
    }, { status: 500 });
  }
}

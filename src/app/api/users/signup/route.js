import { dbConnect } from "@/dbConfig/dbConfig";
import { sendVerificationEmail } from "@/helper/sendVerificationCode";
import User from "@/models/userModel";
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '@/utils/cloudinary';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads manually
  },
};

export async function POST(req) {
  dbConnect();

  // Create a new form instance
  const form = new formidable.IncomingForm({
    keepExtensions: true, // Preserve file extensions
    multiples: true, // Support multiple files
  });

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return resolve(new Response(JSON.stringify({ error: 'Form parsing failed' }), { status: 500 }));
      }

      const { username, email, password, fullName } = fields;
      const avatar = files.avatar[0]; // Handle single file upload

      try {
        const isUsername = await User.findOne({ username });
        const user = await User.findOne({ email });
        const hashedPassword = await bcrypt.hash(password, 10);

        let verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        if (user) {
          return resolve(new Response(JSON.stringify({
            message: "Email is already in use",
            success: false
          }), { status: 400 }));
        } else if (isUsername) {
          return resolve(new Response(JSON.stringify({
            message: "Username is already taken",
            success: false
          }), { status: 400 }));
        } else {
          // Upload to Cloudinary using the utility function
          const uploadResult = await uploadToCloudinary(avatar.filepath);

          if (!uploadResult || !uploadResult.secure_url) {
            return resolve(new Response(JSON.stringify({
              message: "Problem uploading image",
              success: false
            }), { status: 500 }));
          }

          // Create new user
          let newUser = await User.create({
            fullName,
            username,
            email,
            avatar: uploadResult.secure_url,
            password: hashedPassword,
            verifyCode: verifyCode,
            verifyCodeExpiry: new Date(Date.now() + 3600000),
          });

          // Send verification email
          const result = await sendVerificationEmail(email, username, verifyCode);

          if (!result.success) {
            return resolve(new Response(JSON.stringify({
              success: false,
              message: `Error sending verification code: ${result.message}`,
            }), { status: 500 }));
          }

          return resolve(new Response(JSON.stringify({
            success: true,
            message: 'User registered successfully. Please verify your account.',
          }), { status: 201 }));
        }
      } catch (error) {
        console.error('Error registering user:', error);
        return resolve(new Response(JSON.stringify({
          success: false,
          message: 'Error registering user',
        }), { status: 500 }));
      }
    });
  });
}

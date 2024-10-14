
import ForgetPassword from "../../email/ForgetPasswordTemplate";
import { resend } from '@/lib/resend'
import { Resend } from 'resend';

export async function ForgetPasswordVerification(
  email,
  username,
  hashedToken,
) {
  try {

    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Forget password Link',
      react: ForgetPassword({ username, otp: hashedToken }),
    });
    return { success: true, message: 'Password Change Link email sent successfully.' };
  } catch (emailError) {
    console.log("hasedToken ",hashedToken);
    
    console.error('Error sending password change email:', emailError);
    return { success: false, message: 'Failed to send password change email.' };
  }
}

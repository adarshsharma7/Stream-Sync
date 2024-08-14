
import VerificationEmail from "../../email/EmailTemplate";
import { resend } from '@/lib/resend'
import { Resend } from 'resend';

export async function sendVerificationEmail(
  email,
  username,
  verifyCode,
) {
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Mystery Message Verification Code',
      react: VerificationEmail({ username, otp: verifyCode }),
    });
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.' };
  }
}


import verifyEmailHtml from "../../email/EmailTemplate";
import {transport}from '@/lib/resend'

export async function sendVerificationEmail(
  email,
  username,
  verifyCode,
) {
  try {


    await transport.sendMail({
        from: 'adarshsharma7p@gmail.com',
        to: `${email}`,
        subject: 'Sync Draw Verification Code',
        html:verifyEmailHtml(username,verifyCode),
    });

    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.' };
  }
}

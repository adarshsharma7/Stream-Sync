// ForgetPasswordVerification.js

import forgetPasswordHtml from "../../email/ForgetPasswordTemplate";
import {transport}from '@/lib/resend'

export async function ForgetPasswordVerification(email, username, hashedToken) {
  try {
  
    // Generate the password reset link (assuming you use a route to handle the reset)
    const resetLink = `https://streaming-sync.vercel.app/forgetpassword?token=${hashedToken}`;

    // Send the email
    await transport.sendMail({
      from: 'adarshsharma7p@gmail.com', // Sender address
      to: email, // Recipient email address
      subject: 'Reset Your Password', // Subject line
      html: forgetPasswordHtml(username, resetLink), // HTML content from template
    });

    return { success: true, message: 'Password reset email sent successfully.' };
  } catch (emailError) {
    console.error('Error sending password reset email:', emailError);
    return { success: false, message: 'Failed to send password reset email.' };
  }
}

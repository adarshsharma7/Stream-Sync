const forgetPasswordHtml = (username, resetLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto;">
    <img src="/sync-draw-logo.png" alt="Logo" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
      <h2 style="color: #333333; text-align: center;">Reset Your Password</h2>
      <p style="color: #666666; text-align: center;">Hello ${username},</p>
      <p style="color: #666666; text-align: center;">We received a request to reset your password. To complete the process, click the link below:</p>
      <div style="text-align: center; margin-top: 30px;">
        <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 5px;">Reset Password</a>
      </div>
      <p style="color: #666666; text-align: center; margin-top: 20px;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
`;

export default forgetPasswordHtml;

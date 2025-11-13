import nodemailer from "nodemailer"

// Create reusable transporter
const createTransporter = () => {
  // Check if email is configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("[v0] Email not configured - using console logging for development")
    return null
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

export const sendPasswordResetEmail = async (email, resetToken) => {
  const transporter = createTransporter()

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: `"Habitly" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - Habitly",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Habitly account. Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p>Best regards,<br>The Habitly Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request
      
      Hello,
      
      We received a request to reset your password for your Habitly account.
      
      Click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request a password reset, you can safely ignore this email.
      
      Best regards,
      The Habitly Team
    `,
  }

  // If transporter is not configured, log to console (development mode)
  if (!transporter) {
    console.log("\n=== PASSWORD RESET EMAIL (DEV MODE) ===")
    console.log(`To: ${email}`)
    console.log(`Subject: ${mailOptions.subject}`)
    console.log(`Reset Link: ${resetUrl}`)
    console.log("========================================\n")
    return { success: true, mode: "console" }
  }

  // Send actual email
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[v0] Password reset email sent to ${email}`)
    console.log(`[v0] Message ID: ${info.messageId}`)
    return { success: true, mode: "email", messageId: info.messageId }
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    // Fallback to console logging if email fails
    console.log("\n=== PASSWORD RESET EMAIL (FALLBACK) ===")
    console.log(`To: ${email}`)
    console.log(`Reset Link: ${resetUrl}`)
    console.log("========================================\n")
    return { success: true, mode: "console-fallback" }
  }
}

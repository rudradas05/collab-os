import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetOTP(
  email: string,
  otp: string,
  userName: string,
) {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "CollabOS+ <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Password - CollabOS+",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                    CollabOS+
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">
                    Password Reset Request
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #18181b; margin: 0 0 20px; font-size: 20px;">
                    Hello, ${userName}!
                  </h2>
                  <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                    We received a request to reset your password. Use the OTP code below to reset your password:
                  </p>
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 25px;">
                    <p style="margin: 0 0 10px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Your OTP Code
                    </p>
                    <p style="margin: 0; font-size: 36px; font-weight: bold; color: #1d4ed8; letter-spacing: 8px; font-family: monospace;">
                      ${otp}
                    </p>
                  </div>
                  <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0 0 20px;">
                    This OTP is valid for <strong>10 minutes</strong>. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 25px 0;">
                  <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                    This email was sent by CollabOS+. Please do not reply to this email.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hello ${userName},\n\nWe received a request to reset your password. Use the OTP code below to reset your password:\n\nOTP: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.\n\nCollabOS+ Team`,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

/**
 * Send email notification when a workspace is created
 */
export async function sendWorkspaceCreatedEmail(
  email: string,
  userName: string,
  workspaceName: string,
) {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "CollabOS+ <onboarding@resend.dev>",
      to: email,
      subject: `Workspace Created: ${workspaceName} - CollabOS+`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CollabOS+</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Workspace Created</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #18181b; margin: 0 0 20px; font-size: 20px;">Hello, ${userName}!</h2>
                  <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                    Your new workspace <strong>${workspaceName}</strong> has been created successfully!
                  </p>
                  <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 25px;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #059669;">🎉 ${workspaceName}</p>
                    <p style="margin: 10px 0 0; color: #64748b; font-size: 14px;">Ready to collaborate!</p>
                  </div>
                  <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0 0 20px;">
                    Start inviting team members and creating projects to boost your productivity.
                  </p>
                  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 25px 0;">
                  <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                    This email was sent by CollabOS+.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hello ${userName},\n\nYour new workspace "${workspaceName}" has been created successfully!\n\nStart inviting team members and creating projects to boost your productivity.\n\nCollabOS+ Team`,
    });

    if (error) {
      console.error("Failed to send workspace email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send workspace email:", error);
    return { success: false, error };
  }
}

/**
 * Send email notification when subscription is updated
 */
export async function sendSubscriptionUpdatedEmail(
  email: string,
  userName: string,
  plan: string,
  action: "activated" | "updated" | "canceled",
) {
  const actionText = {
    activated: "activated",
    updated: "updated",
    canceled: "canceled",
  };

  const colorMap = {
    activated: {
      primary: "#3b82f6",
      secondary: "#1d4ed8",
      bg1: "#eff6ff",
      bg2: "#dbeafe",
    },
    updated: {
      primary: "#8b5cf6",
      secondary: "#7c3aed",
      bg1: "#f5f3ff",
      bg2: "#ede9fe",
    },
    canceled: {
      primary: "#ef4444",
      secondary: "#dc2626",
      bg1: "#fef2f2",
      bg2: "#fee2e2",
    },
  };

  const colors = colorMap[action];

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "CollabOS+ <onboarding@resend.dev>",
      to: email,
      subject: `Subscription ${actionText[action].charAt(0).toUpperCase() + actionText[action].slice(1)} - CollabOS+`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <tr>
                <td style="background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">CollabOS+</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Subscription ${actionText[action]}</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: white; padding: 40px 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <h2 style="color: #18181b; margin: 0 0 20px; font-size: 20px;">Hello, ${userName}!</h2>
                  <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                    Your subscription has been ${actionText[action]}.
                  </p>
                  <div style="background: linear-gradient(135deg, ${colors.bg1} 0%, ${colors.bg2} 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 25px;">
                    <p style="margin: 0 0 5px; color: #64748b; font-size: 12px; text-transform: uppercase;">Plan</p>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${colors.secondary};">${plan}</p>
                  </div>
                  <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0 0 20px;">
                    ${action === "canceled" ? "We're sorry to see you go. Your access will remain until the end of your billing period." : "Thank you for choosing CollabOS+. Enjoy your enhanced features!"}
                  </p>
                  <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 25px 0;">
                  <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                    This email was sent by CollabOS+.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      text: `Hello ${userName},\n\nYour subscription has been ${actionText[action]}.\n\nPlan: ${plan}\n\n${action === "canceled" ? "We're sorry to see you go. Your access will remain until the end of your billing period." : "Thank you for choosing CollabOS+. Enjoy your enhanced features!"}\n\nCollabOS+ Team`,
    });

    if (error) {
      console.error("Failed to send subscription email:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send subscription email:", error);
    return { success: false, error };
  }
}

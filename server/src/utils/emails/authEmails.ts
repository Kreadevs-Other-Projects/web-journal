import { transporter } from "../../configs/email";
import { env } from "../../configs/envs";
import { baseEmailTemplate } from "./baseEmailTemplate";

export const sendOTPEmail = async (email: string, otpCode: string) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: `Your verification code — ${otpCode}`,
      html: baseEmailTemplate(
        "Verification Code",
        `
          <p>Dear User,</p>
          <p>Use the following code to verify your identity on Paperuno:</p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #0B1220; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #2563eb; font-family: monospace;">
                ${otpCode}
              </span>
            </div>
          </div>

          <p style="text-align: center; color: #9CA3AF; font-size: 14px;">
            This code expires in <strong style="color: #E5E7EB;">10 minutes</strong>
          </p>
          <p>If you did not request this code, please ignore this email.</p>
        `,
      ),
      text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("OTP email sending failed");
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  otpCode: string,
) => {
  try {
    await transporter.sendMail({
      from: `"Paperuno" <${env.EMAIL_FROM}>`,
      to: email,
      subject: "Password Reset Request",
      html: baseEmailTemplate(
        "Password Reset",
        `
          <p>Hello,</p>
          <p>You requested to reset your password. Use the code below:</p>
          <div class="code">${otpCode}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If this wasn't you, please ignore this email.</p>
        `,
      ),
      text: `Your password reset code is ${otpCode}. It will expire in 10 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Password reset email failed");
  }
};

import { sendEmail } from '../utils/sendEmail.js';

export const sendPasswordResetEmail = async ({ to, resetUrl, expiresInMinutes }) => {
  const subject = 'Reset your password';
  const text = `We received a request to reset your password.\n\nReset link: ${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes.\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 12px;">Reset your password</h2>
      <p style="margin: 0 0 12px; color: #334155;">
        We received a request to reset your RecruitKr password.
      </p>
      <p style="margin: 0 0 20px; color: #475569;">
        This link expires in ${expiresInMinutes} minutes.
      </p>
      <p style="margin: 0 0 20px;">
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 10px; background: #264a7f; color: #ffffff; text-decoration: none; font-weight: 700;">
          Reset Password
        </a>
      </p>
      <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="margin: 0 0 20px; font-size: 12px; color: #64748b; word-break: break-all;">
        ${resetUrl}
      </p>
      <p style="margin: 0; font-size: 12px; color: #64748b;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text,
    html,
  });
};


import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const buildTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new ApiError(
      503,
      'Email service is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS (and optional SMTP_FROM).',
    );
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

let cachedTransporter = null;

const getTransporter = () => {
  if (!cachedTransporter) cachedTransporter = buildTransporter();
  return cachedTransporter;
};

const getFromAddress = () => env.SMTP_FROM || env.SMTP_USER;

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const transporter = getTransporter();

  const subject = 'Reset your RecruitKr password';
  const text = `We received a request to reset your password.\n\nReset link: ${resetUrl}\n\nIf you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.5;">
      <h2 style="margin:0 0 12px;">Reset your password</h2>
      <p style="margin:0 0 12px;">We received a request to reset your RecruitKr password.</p>
      <p style="margin:0 0 16px;">
        <a href="${resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#264a7f;color:#fff;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:12px;color:#6b7280;">If the button doesn't work, copy and paste this link:</p>
      <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
      <p style="margin:0;font-size:12px;color:#6b7280;">If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject,
    text,
    html,
  });
};


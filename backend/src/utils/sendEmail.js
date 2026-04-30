import nodemailer from 'nodemailer';

import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

let transporter = null;

const getTransporter = () => {
  if (!env.BREVO_EMAIL || !env.BREVO_SMTP_KEY) {
    throw new ApiError(
      503,
      'Email service is not configured. Set BREVO_EMAIL and BREVO_SMTP_KEY.',
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: env.BREVO_EMAIL,
        pass: env.BREVO_SMTP_KEY,
      },
    });
  }

  return transporter;
};

// Shared Brevo SMTP sender used by password reset and any future transactional emails.
export const sendEmail = async ({ to, subject, html, text }) => {
  const client = getTransporter();

  return client.sendMail({
    from: env.BREVO_EMAIL,
    to,
    subject,
    html,
    text,
  });
};

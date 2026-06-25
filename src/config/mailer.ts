import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

let transporter: nodemailer.Transporter;

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT || 587,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
  logger.info('Nodemailer SMTP transporter initialized');
} else {
  logger.warn('Nodemailer configuration missing. Defaulting to Ethereal mock email client.');
  // Fallback to test account
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass',
    },
  });
}

export { transporter };

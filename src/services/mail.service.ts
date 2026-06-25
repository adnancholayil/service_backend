import { transporter } from '../config/mailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class MailService {
  async sendOTP(email: string, name: string, otp: string): Promise<void> {
    const mailOptions = {
      from: env.SMTP_FROM,
      to: email,
      subject: 'ServiceHub - OTP Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4A90E2; text-align: center;">Verify Your Account</h2>
          <p>Hello ${name},</p>
          <p>Thank you for choosing ServiceHub. Please use the following One-Time Password (OTP) to verify your request. This OTP is valid for 10 minutes:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background-color: #f5f5f5; padding: 10px 20px; border-radius: 4px; border: 1px dashed #ccc;">${otp}</span>
          </div>
          <p>If you did not make this request, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">This is an automated email. Please do not reply.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`OTP email sent successfully to ${email}`);
    } catch (error: any) {
      logger.error(`Error sending OTP email to ${email}: ${error.message}`);
    }
  }

  async sendBookingNotification(
    email: string,
    customerName: string,
    providerName: string,
    serviceName: string,
    bookingDate: Date,
    status: string
  ): Promise<void> {
    const formattedDate = new Date(bookingDate).toLocaleString();
    const mailOptions = {
      from: env.SMTP_FROM,
      to: email,
      subject: `ServiceHub - Booking Status Update: ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4A90E2; text-align: center;">Booking Status Update</h2>
          <p>Hello,</p>
          <p>Your booking details have been updated. Please find the details below:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Service:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Customer:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Provider:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${providerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Booking Time:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Status:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; color: #4A90E2; font-weight: bold;">${status}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">This is an automated email from ServiceHub.</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Booking status email sent to ${email}`);
    } catch (error: any) {
      logger.error(`Error sending booking email to ${email}: ${error.message}`);
    }
  }
}
export const mailService = new MailService();

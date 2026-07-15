import { Document, Types } from 'mongoose';
import { UserRole } from '../constants';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  isEmailVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  forgotPasswordOtp?: string;
  forgotPasswordOtpExpiry?: Date;
  refreshToken?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

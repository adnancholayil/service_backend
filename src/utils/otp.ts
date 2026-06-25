import crypto from 'crypto';

export const generateOTP = (): string => {
  // Generates a 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateOTPExpiry = (minutes = 10): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const isOTPExpired = (expiry: Date): boolean => {
  return new Date() > expiry;
};

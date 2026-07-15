import { UserRepository } from '../repositories/user.repository';
import { ProviderRepository } from '../repositories/provider.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateOTP, generateOTPExpiry, isOTPExpired } from '../utils/otp';
import { mailService } from './mail.service';
import { UserRole, VerificationStatus } from '../constants';
import { ValidationError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import { IUser } from '../interfaces/user.interface';
import { OAuth2Client } from 'google-auth-library';
import mongoose from 'mongoose';
import { CategoryRepository } from '../repositories/category.repository';

export class AuthService {
  private userRepository: UserRepository;
  private providerRepository: ProviderRepository;
  private categoryRepository: CategoryRepository;
  private googleClient: OAuth2Client;

  constructor() {
    this.userRepository = new UserRepository();
    this.providerRepository = new ProviderRepository();
    this.categoryRepository = new CategoryRepository();
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'placeholder');
  }

  async register(
    userData: { name: string; email: string; password?: string; role: UserRole },
    providerData?: {
      businessName: string;
      description: string;
      category: string;
      address: string;
      phone: string;
      whatsapp?: string;
      coordinates: [number, number]; // [longitude, latitude]
    }
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const otp = generateOTP();
    const otpExpiry = generateOTPExpiry(10); // 10 mins

    // Create the User
    const user = await this.userRepository.create({
      ...userData,
      otp,
      otpExpiry,
    } as any);

    // If role is PROVIDER, create the provider profile
    if (userData.role === UserRole.PROVIDER) {
      if (!providerData) {
        throw new ValidationError('Provider business details are required');
      }

      let finalCategoryId = providerData.category;
      
      // If it's not a valid ObjectId, assume it's a new custom category name
      if (!mongoose.Types.ObjectId.isValid(finalCategoryId)) {
        const slug = finalCategoryId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newCat = await this.categoryRepository.create({
          name: finalCategoryId,
          slug,
          isActive: true
        } as any);
        finalCategoryId = newCat._id.toString();
      }

      await this.providerRepository.create({
        user: user._id,
        businessName: providerData.businessName,
        description: providerData.description,
        category: finalCategoryId as any,
        address: providerData.address,
        phone: providerData.phone,
        whatsapp: providerData.whatsapp,
        location: {
          type: 'Point',
          coordinates: providerData.coordinates,
        },
        verificationStatus: VerificationStatus.PENDING,
      } as any);
    }

    // Send verification email
    await mailService.sendOTP(user.email, user.name, otp);

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async login(
    email: string,
    password?: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    if (password && !(await (user as any).comparePassword(password))) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return { user, accessToken, refreshToken };
  }

  async googleLogin(
    token: string,
    role: UserRole = UserRole.CUSTOMER
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID || 'placeholder',
      });
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new UnauthorizedError('Invalid Google token');
      }

      const { email, name, picture } = payload;
      let user = await this.userRepository.findByEmail(email);

      if (!user) {
        // Create new user automatically
        user = await this.userRepository.create({
          name: name || 'Google User',
          email: email,
          role: role,
          isEmailVerified: true,
          avatar: picture,
          isActive: true,
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
        } as any);

        if (role === UserRole.PROVIDER) {
          let defaultCategory = await this.categoryRepository.findOne({ slug: 'uncategorized' });
          if (!defaultCategory) {
            defaultCategory = await this.categoryRepository.create({
              name: 'Uncategorized',
              slug: 'uncategorized',
              isActive: true
            } as any);
          }

          await this.providerRepository.create({
            user: user._id,
            businessName: name || 'Google User',
            description: 'New Service Provider (Please update profile)',
            category: defaultCategory._id as any,
            address: 'Update your address',
            phone: 'Update phone number',
            location: {
              type: 'Point',
              coordinates: [0, 0],
            },
            verificationStatus: VerificationStatus.PENDING,
          } as any);
        }
      } else {
        if (!user.isActive) {
          throw new UnauthorizedError('User account is deactivated');
        }
        if (!user.avatar && picture) {
          user.avatar = picture;
          await user.save();
        }
      }

      const jwtPayload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(jwtPayload);
      const refreshToken = generateRefreshToken(jwtPayload);

      user.refreshToken = refreshToken;
      await user.save();

      return { user, accessToken, refreshToken };
    } catch (err) {
      console.error('Google Auth Error:', err);
      throw new UnauthorizedError('Google authentication failed');
    }
  }

  async logout(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    return true;
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await this.userRepository.findByRefreshToken(token);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const payload = { userId: user._id.toString(), role: user.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      user.refreshToken = refreshToken;
      await user.save();

      return { accessToken, refreshToken };
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async verifyOTP(email: string, otp: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Fetch user with otp fields loaded
    const userWithOtp = await this.userRepository.findByOtp(otp);
    if (!userWithOtp || userWithOtp.email !== user.email) {
      throw new ValidationError('Invalid verification code');
    }

    if (userWithOtp.otpExpiry && isOTPExpired(userWithOtp.otpExpiry)) {
      throw new ValidationError('Verification code expired');
    }

    userWithOtp.isEmailVerified = true;
    userWithOtp.otp = undefined;
    userWithOtp.otpExpiry = undefined;
    await userWithOtp.save();

    return true;
  }

  async forgotPassword(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const otp = generateOTP();
    const expiry = generateOTPExpiry(15); // 15 mins

    user.forgotPasswordOtp = otp;
    user.forgotPasswordOtpExpiry = expiry;
    await user.save();

    await mailService.sendOTP(user.email, user.name, otp);
    return true;
  }

  async resetPassword(email: string, otp: string, password?: string): Promise<boolean> {
    const user = await this.userRepository.findByForgotPasswordOtp(otp);
    if (!user || user.email !== email.toLowerCase()) {
      throw new ValidationError('Invalid verification code');
    }

    if (user.forgotPasswordOtpExpiry && isOTPExpired(user.forgotPasswordOtpExpiry)) {
      throw new ValidationError('Verification code expired');
    }

    user.password = password;
    user.forgotPasswordOtp = undefined;
    user.forgotPasswordOtpExpiry = undefined;
    await user.save();

    return true;
  }

  async changePassword(userId: string, oldPassword?: string, newPassword?: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (oldPassword && !(await (user as any).comparePassword(oldPassword))) {
      throw new ValidationError('Incorrect current password');
    }

    user.password = newPassword;
    await user.save();
    return true;
  }
}

export const authService = new AuthService();

import { BaseRepository } from './base.repository';
import { IUser } from '../interfaces/user.interface';
import { User } from '../models/User';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    let query: any = this.model.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query = query.select('+password');
    }
    return query.exec();
  }

  async findByOtp(otp: string): Promise<IUser | null> {
    return (this.model.findOne({ otp }) as any).select('+otp +otpExpiry').exec();
  }

  async findByForgotPasswordOtp(otp: string): Promise<IUser | null> {
    return (this.model.findOne({ forgotPasswordOtp: otp }) as any).select('+forgotPasswordOtp +forgotPasswordOtpExpiry').exec();
  }

  async findByRefreshToken(refreshToken: string): Promise<IUser | null> {
    return (this.model.findOne({ refreshToken }) as any).select('+refreshToken').exec();
  }
}

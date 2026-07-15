import { Document, Types } from 'mongoose';
import { VerificationStatus } from '../constants';

export interface IProvider extends Document {
  user: Types.ObjectId;
  businessName: string;
  description: string;
  category: Types.ObjectId;
  services: Types.ObjectId[];
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  phone: string;
  whatsapp?: string;
  subscriptionPlan: 'NONE' | 'TRIAL' | 'MONTHLY' | 'YEARLY';
  subscriptionStatus: 'PENDING_PAYMENT' | 'ACTIVE' | 'INACTIVE';
  subscriptionExpiry?: Date;
  verificationStatus: VerificationStatus;
  rating: number;
  reviewsCount: number;
  banner?: string;
  portfolio?: string[];
  createdAt: Date;
  updatedAt: Date;
}

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
  verificationStatus: VerificationStatus;
  rating: number;
  reviewsCount: number;
  banner?: string;
  createdAt: Date;
  updatedAt: Date;
}

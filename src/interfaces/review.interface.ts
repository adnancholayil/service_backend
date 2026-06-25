import { Document, Types } from 'mongoose';

export interface IReview extends Document {
  booking: Types.ObjectId;
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Document } from 'mongoose';

export interface IBanner extends Document {
  title: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

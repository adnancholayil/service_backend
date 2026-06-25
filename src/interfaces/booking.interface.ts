import { Document, Types } from 'mongoose';
import { BookingStatus } from '../constants';

export interface IBooking extends Document {
  customer: Types.ObjectId;
  provider: Types.ObjectId;
  service: Types.ObjectId;
  bookingDate: Date;
  status: BookingStatus;
  location: {
    address: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  totalPrice: number;
  notes?: string;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

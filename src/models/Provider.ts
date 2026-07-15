import { Schema, model } from 'mongoose';
import { IProvider } from '../interfaces/provider.interface';
import { VerificationStatus } from '../constants';

export enum SubscriptionPlan {
  NONE = 'NONE',
  TRIAL = 'TRIAL',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

const ProviderSchema = new Schema<IProvider>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    services: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    whatsapp: {
      type: String,
    },
    subscriptionPlan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.NONE,
    },
    subscriptionStatus: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING_PAYMENT,
    },
    subscriptionExpiry: {
      type: Date,
    },
    banner: {
      type: String,
    },
    portfolio: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
ProviderSchema.index({ location: '2dsphere' });

export const Provider = model<IProvider>('Provider', ProviderSchema);

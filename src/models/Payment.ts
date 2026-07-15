import { Schema, model, Document } from 'mongoose';

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum PaymentMethod {
  RAZORPAY = 'RAZORPAY',
  OFFLINE = 'OFFLINE',
}

export interface IPayment extends Document {
  provider: Schema.Types.ObjectId;
  plan: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING_VERIFICATION,
    },
    transactionId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);

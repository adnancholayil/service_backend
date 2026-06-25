import { Schema, model } from 'mongoose';
import { IDispute } from '../interfaces/dispute.interface';
import { DisputeStatus } from '../constants';

const DisputeSchema = new Schema<IDispute>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    raisedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.PENDING,
      index: true,
    },
    resolutionDetails: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Dispute = model<IDispute>('Dispute', DisputeSchema);

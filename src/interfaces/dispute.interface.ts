import { Document, Types } from 'mongoose';
import { DisputeStatus } from '../constants';

export interface IDispute extends Document {
  booking: Types.ObjectId;
  raisedBy: Types.ObjectId;
  reason: string;
  status: DisputeStatus;
  resolutionDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

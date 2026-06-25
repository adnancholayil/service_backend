import { BaseRepository } from './base.repository';
import { IDispute } from '../interfaces/dispute.interface';
import { Dispute } from '../models/Dispute';

export class DisputeRepository extends BaseRepository<IDispute> {
  constructor() {
    super(Dispute);
  }

  async findByRaisedBy(userId: string): Promise<IDispute[]> {
    return this.model.find({ raisedBy: userId }).populate('booking').sort({ createdAt: -1 }).exec();
  }

  async findAllDetailed(): Promise<IDispute[]> {
    return this.model
      .find()
      .populate('booking')
      .populate('raisedBy', 'name email role')
      .sort({ createdAt: -1 })
      .exec();
  }
}

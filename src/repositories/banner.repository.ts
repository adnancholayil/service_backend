import { BaseRepository } from './base.repository';
import { IBanner } from '../interfaces/banner.interface';
import { Banner } from '../models/Banner';

export class BannerRepository extends BaseRepository<IBanner> {
  constructor() {
    super(Banner);
  }

  async findActive(): Promise<IBanner[]> {
    return this.model.find({ isActive: true }).sort({ createdAt: -1 }).exec();
  }
}

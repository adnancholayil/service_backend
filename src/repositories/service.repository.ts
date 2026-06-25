import { BaseRepository } from './base.repository';
import { IService } from '../interfaces/service.interface';
import { Service } from '../models/Service';

export class ServiceRepository extends BaseRepository<IService> {
  constructor() {
    super(Service);
  }

  async findByProviderId(providerId: string): Promise<IService[]> {
    return this.model.find({ provider: providerId, isActive: true }).populate('category').exec();
  }

  async searchGlobal(category?: string, search?: string): Promise<IService[]> {
    const filter: any = { isActive: true };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    return this.model
      .find(filter)
      .populate('category')
      .populate({
        path: 'provider',
        populate: { path: 'user', select: '-password' }
      })
      .exec();
  }
}

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
}

import { BaseRepository } from './base.repository';
import { IProvider } from '../interfaces/provider.interface';
import { Provider } from '../models/Provider';
import { VerificationStatus } from '../constants';

export class ProviderRepository extends BaseRepository<IProvider> {
  constructor() {
    super(Provider);
  }

  async findByUserId(userId: string, populate?: any): Promise<IProvider | null> {
    let query = this.model.findOne({ user: userId });
    if (populate) {
      query = query.populate(populate);
    }
    return query.exec();
  }

  async findTopRated(
    category?: string,
    limit = 20,
    page = 1
  ): Promise<{ data: IProvider[]; total: number }> {
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    const data = await this.model
      .find(filter)
      .sort({ rating: -1, reviewsCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', '-password')
      .populate('category')
      .exec();

    const total = await this.model.countDocuments(filter);

    return { data, total };
  }

  async findNearLocation(
    longitude: number,
    latitude: number,
    maxDistanceInMeters = 50000, // 50km
    category?: string,
    limit = 20,
    page = 1
  ): Promise<{ data: IProvider[]; total: number }> {
    const filter: any = {
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceInMeters,
        },
      },
    };

    if (category) {
      filter.category = category;
    }

    const data = await this.model
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', '-password')
      .populate('category')
      .exec();

    const total = await this.model.countDocuments({
      verificationStatus: VerificationStatus.VERIFIED,
      ...(category ? { category } : {}),
    });

    return { data, total };
  }
}

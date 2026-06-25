import { BaseRepository } from './base.repository';
import { IReview } from '../interfaces/review.interface';
import { Review } from '../models/Review';

export class ReviewRepository extends BaseRepository<IReview> {
  constructor() {
    super(Review);
  }

  async findByProviderId(providerId: string): Promise<IReview[]> {
    return this.model
      .find({ provider: providerId })
      .populate('customer', 'name avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAverageRatingForProvider(providerId: string): Promise<{ average: number; count: number }> {
    const result = await this.model.aggregate([
      { $match: { provider: providerId } },
      {
        $group: {
          _id: '$provider',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return { average: 0, count: 0 };
    }

    return {
      average: Number(result[0].average.toFixed(1)),
      count: result[0].count,
    };
  }
}

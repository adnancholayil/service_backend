import { ProviderRepository } from '../repositories/provider.repository';
import { ReviewRepository } from '../repositories/review.repository';
import { UserRepository } from '../repositories/user.repository';
import { IProvider } from '../interfaces/provider.interface';
import { IReview } from '../interfaces/review.interface';
import { VerificationStatus, SOCKET_EVENTS } from '../constants';
import { NotFoundError, ValidationError } from '../utils/errors';
import { eventBus } from '../utils/eventBus';

export class ProviderService {
  private providerRepository: ProviderRepository;
  private reviewRepository: ReviewRepository;
  private userRepository: UserRepository;

  constructor() {
    this.providerRepository = new ProviderRepository();
    this.reviewRepository = new ReviewRepository();
    this.userRepository = new UserRepository();
  }

  async updateLocation(providerUserId: string, longitude: number, latitude: number): Promise<IProvider> {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      throw new NotFoundError('Provider profile not found');
    }

    provider.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
    await provider.save();

    // Broadcast location update
    eventBus.emit(SOCKET_EVENTS.PROVIDER_LOCATION_UPDATED, {
      providerId: provider._id.toString(),
      coordinates: [longitude, latitude],
    });

    return provider;
  }

  async verifyProvider(providerId: string, status: VerificationStatus): Promise<IProvider> {
    const provider = await this.providerRepository.findById(providerId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    provider.verificationStatus = status;
    await provider.save();
    return provider;
  }

  async getTopProviders(category?: string): Promise<IProvider[]> {
    const result = await this.providerRepository.findTopRated(category);
    return result.data;
  }

  async getProvidersNear(longitude: number, latitude: number, maxDistance?: number, category?: string): Promise<IProvider[]> {
    const result = await this.providerRepository.findNearLocation(longitude, latitude, maxDistance, category);
    return result.data;
  }

  async addReview(bookingId: string, customerId: string, rating: number, comment?: string): Promise<IReview> {
    // Check if review already exists for the booking
    const existing = await this.reviewRepository.findOne({ booking: bookingId });
    if (existing) {
      throw new ValidationError('You have already reviewed this booking');
    }

    // Lazy load Booking service to avoid circular dependency
    const { bookingService } = await import('./booking.service');
    const booking = await bookingService.getBookingDetails(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer.toString() !== customerId) {
      throw new ValidationError('You are not authorized to review this booking');
    }

    const review = await this.reviewRepository.create({
      booking: booking._id,
      customer: customerId as any,
      provider: booking.provider as any,
      rating,
      comment,
    } as any);

    // Update Provider average rating
    const providerId = booking.provider.toString();
    const stats = await this.reviewRepository.getAverageRatingForProvider(providerId);
    
    await this.providerRepository.update(providerId, {
      rating: stats.average,
      reviewsCount: stats.count,
    });

    return review;
  }

  async getProviderReviews(providerUserId: string): Promise<IReview[]> {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }
    return this.reviewRepository.findByProviderId(provider._id.toString());
  }
}

export const providerService = new ProviderService();

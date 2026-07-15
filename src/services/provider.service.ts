import { ProviderRepository } from '../repositories/provider.repository';
import { ReviewRepository } from '../repositories/review.repository';
import { UserRepository } from '../repositories/user.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { IProvider } from '../interfaces/provider.interface';
import { IReview } from '../interfaces/review.interface';
import { VerificationStatus, SOCKET_EVENTS } from '../constants';
import { NotFoundError, ValidationError } from '../utils/errors';
import { eventBus } from '../utils/eventBus';
import { Payment, PaymentStatus, PaymentMethod } from '../models/Payment';

export class ProviderService {
  private providerRepository: ProviderRepository;
  private reviewRepository: ReviewRepository;
  private userRepository: UserRepository;
  private bookingRepository: BookingRepository;

  constructor() {
    this.providerRepository = new ProviderRepository();
    this.reviewRepository = new ReviewRepository();
    this.userRepository = new UserRepository();
    this.bookingRepository = new BookingRepository();
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

  async updateProfile(providerUserId: string, businessName?: string, description?: string, address?: string, portfolio?: string[]): Promise<IProvider> {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      throw new NotFoundError('Provider profile not found');
    }

    if (businessName !== undefined) provider.businessName = businessName;
    if (description !== undefined) provider.description = description;
    if (address !== undefined) provider.address = address;
    if (portfolio !== undefined) provider.portfolio = portfolio;

    await provider.save();
    return provider;
  }

  async selectSubscriptionPlan(providerUserId: string, plan: string): Promise<IProvider> {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      throw new NotFoundError('Provider profile not found');
    }
    
    const validPlans = ['TRIAL', 'MONTHLY', 'YEARLY', 'NONE'];
    if (!validPlans.includes(plan)) {
      throw new ValidationError('Invalid subscription plan');
    }

    provider.subscriptionPlan = plan as any;
    
    if (plan === 'TRIAL') {
      provider.subscriptionStatus = 'ACTIVE' as any;
    } else {
      provider.subscriptionStatus = 'PENDING_PAYMENT' as any;
    }
    
    await provider.save();
    return provider;
  }

  async processPayment(providerUserId: string, method: string): Promise<IProvider> {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      throw new NotFoundError('Provider profile not found');
    }
    
    if (provider.subscriptionStatus === 'ACTIVE') {
      return provider;
    }

    let amount = 0;
    if (provider.subscriptionPlan === 'YEARLY') amount = 4999;
    if (provider.subscriptionPlan === 'MONTHLY') amount = 499;

    const payment = new Payment({
      provider: provider._id,
      plan: provider.subscriptionPlan,
      amount: amount,
      method: method === 'razorpay' ? PaymentMethod.RAZORPAY : PaymentMethod.OFFLINE,
      status: method === 'offline' ? PaymentStatus.PENDING_VERIFICATION : PaymentStatus.SUCCESS,
      transactionId: `TXN-${Date.now()}`
    });
    await payment.save();

    provider.subscriptionStatus = 'ACTIVE' as any;
    await provider.save();
    return provider;
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

  async getDashboardStats(providerUserId: string) {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      throw new NotFoundError('Provider profile not found');
    }

    const bookings = await this.bookingRepository.findByProviderId(provider._id.toString());
    
    let totalEarnings = 0;
    let pendingTasks = 0;
    let completedJobs = 0;

    bookings.forEach(b => {
      if (b.status === 'COMPLETED') {
        completedJobs++;
        totalEarnings += b.totalPrice;
      } else if (b.status === 'PENDING') {
        pendingTasks++;
      }
    });

    return {
      totalEarnings,
      pendingTasks,
      completedJobs,
      averageRating: provider.rating || 0,
      subscriptionPlan: provider.subscriptionPlan,
      subscriptionStatus: provider.subscriptionStatus,
      subscriptionExpiry: provider.subscriptionExpiry ? provider.subscriptionExpiry.toISOString() : null,
    };
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

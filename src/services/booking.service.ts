import { BookingRepository } from '../repositories/booking.repository';
import { ServiceRepository } from '../repositories/service.repository';
import { ProviderRepository } from '../repositories/provider.repository';
import { UserRepository } from '../repositories/user.repository';
import { BookingStatus, SOCKET_EVENTS } from '../constants';
import { NotFoundError, ValidationError } from '../utils/errors';
import { mailService } from './mail.service';
import { notificationService } from './notification.service';
import { eventBus } from '../utils/eventBus';
import { IBooking } from '../interfaces/booking.interface';

export class BookingService {
  private bookingRepository: BookingRepository;
  private serviceRepository: ServiceRepository;
  private providerRepository: ProviderRepository;
  private userRepository: UserRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.serviceRepository = new ServiceRepository();
    this.providerRepository = new ProviderRepository();
    this.userRepository = new UserRepository();
  }

  async createBooking(data: {
    customer: string;
    serviceId: string;
    bookingDate: Date;
    address: string;
    coordinates: [number, number];
    notes?: string;
  }): Promise<IBooking> {
    const service = await this.serviceRepository.findById(data.serviceId);
    if (!service || !service.isActive) {
      throw new NotFoundError('Service not found or is inactive');
    }

    const provider = await this.providerRepository.findById(service.provider.toString());
    if (!provider) {
      throw new NotFoundError('Service provider not found');
    }

    const booking = await this.bookingRepository.create({
      customer: data.customer as any,
      provider: provider._id,
      service: service._id,
      bookingDate: data.bookingDate,
      status: BookingStatus.PENDING,
      location: {
        address: data.address,
        coordinates: data.coordinates,
      },
      totalPrice: service.price,
      notes: data.notes,
      paymentStatus: 'PENDING',
    } as any);

    // Create Notification for the provider
    const customer = await this.userRepository.findById(data.customer);
    await notificationService.createNotification({
      recipient: provider.user.toString(),
      sender: data.customer,
      title: 'New Booking Request',
      message: `You have a new booking request for ${service.name} from ${customer?.name || 'Customer'}.`,
      type: 'BOOKING',
      link: `/bookings/${booking._id}`,
    });

    return booking;
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    userId: string
  ): Promise<IBooking> {
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Load related provider and customer
    const provider = await this.providerRepository.findById(booking.provider.toString());
    if (!provider) {
      throw new NotFoundError('Provider not found');
    }

    // Role checks (Providers can accept/reject/complete, Customers can cancel)
    const isProvider = provider.user.toString() === userId;
    const isCustomer = booking.customer.toString() === userId;

    if (!isProvider && !isCustomer) {
      throw new ValidationError('You are not authorized to update this booking');
    }

    if (status === BookingStatus.ACCEPTED || status === BookingStatus.REJECTED || status === BookingStatus.IN_PROGRESS || status === BookingStatus.COMPLETED) {
      if (!isProvider) {
        throw new ValidationError('Only providers can accept, reject, start or complete a booking');
      }
    }

    if (status === BookingStatus.CANCELLED) {
      if (booking.status !== BookingStatus.PENDING && booking.status !== BookingStatus.ACCEPTED) {
        throw new ValidationError('Cannot cancel booking in its current state');
      }
    }

    booking.status = status;
    await booking.save();

    // Send notifications and emails
    const customerUser = await this.userRepository.findById(booking.customer.toString());
    const providerUser = await this.userRepository.findById(provider.user.toString());
    const serviceDetails = await this.serviceRepository.findById(booking.service.toString());

    const recipientId = isProvider ? booking.customer.toString() : provider.user.toString();
    const senderId = userId;

    await notificationService.createNotification({
      recipient: recipientId,
      sender: senderId,
      title: `Booking Status Changed: ${status}`,
      message: `Your booking for ${serviceDetails?.name || 'service'} has been updated to ${status}.`,
      type: 'BOOKING',
      link: `/bookings/${booking._id}`,
    });

    if (customerUser && providerUser && serviceDetails) {
      // Send Email details
      await mailService.sendBookingNotification(
        customerUser.email,
        customerUser.name,
        providerUser.name,
        serviceDetails.name,
        booking.bookingDate,
        status
      );
    }

    // Emit event bus
    eventBus.emit(SOCKET_EVENTS.BOOKING_STATUS_CHANGED, booking);

    return booking;
  }

  async getCustomerBookings(customerId: string): Promise<IBooking[]> {
    return this.bookingRepository.findByCustomerId(customerId);
  }

  async getProviderBookings(providerUserId: string): Promise<IBooking[]> {
    const provider = await this.providerRepository.findByUserId(providerUserId);
    if (!provider) {
      return [];
    }
    return this.bookingRepository.findByProviderId(provider._id.toString());
  }

  async getBookingDetails(bookingId: string): Promise<IBooking | null> {
    return this.bookingRepository.findById(bookingId, undefined, ['customer', 'provider', 'service']);
  }
}

export const bookingService = new BookingService();

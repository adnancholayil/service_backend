import { BaseRepository } from './base.repository';
import { IBooking } from '../interfaces/booking.interface';
import { Booking } from '../models/Booking';

export class BookingRepository extends BaseRepository<IBooking> {
  constructor() {
    super(Booking);
  }

  async findByCustomerId(customerId: string): Promise<IBooking[]> {
    return this.model
      .find({ customer: customerId })
      .populate('provider')
      .populate('service')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProviderId(providerId: string): Promise<IBooking[]> {
    return this.model
      .find({ provider: providerId })
      .populate('customer', '-password')
      .populate('service')
      .sort({ createdAt: -1 })
      .exec();
  }
}

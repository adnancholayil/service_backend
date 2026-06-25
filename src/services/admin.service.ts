import { CategoryRepository } from '../repositories/category.repository';
import { BannerRepository } from '../repositories/banner.repository';
import { DisputeRepository } from '../repositories/dispute.repository';
import { UserRepository } from '../repositories/user.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { ICategory } from '../interfaces/category.interface';
import { IBanner } from '../interfaces/banner.interface';
import { IDispute } from '../interfaces/dispute.interface';
import { DisputeStatus } from '../constants';
import { NotFoundError } from '../utils/errors';

export class AdminService {
  private categoryRepository: CategoryRepository;
  private bannerRepository: BannerRepository;
  private disputeRepository: DisputeRepository;
  private userRepository: UserRepository;
  private bookingRepository: BookingRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
    this.bannerRepository = new BannerRepository();
    this.disputeRepository = new DisputeRepository();
    this.userRepository = new UserRepository();
    this.bookingRepository = new BookingRepository();
  }

  // --- Category CRUD ---
  async createCategory(name: string, icon?: string): Promise<ICategory> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return this.categoryRepository.create({ name, slug, icon, isActive: true } as any);
  }

  async updateCategory(id: string, name: string, icon?: string, isActive?: boolean): Promise<ICategory | null> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return this.categoryRepository.update(id, { name, slug, icon, isActive });
  }

  async deleteCategory(id: string): Promise<boolean> {
    await this.categoryRepository.delete(id);
    return true;
  }

  async getAllCategories(): Promise<ICategory[]> {
    return this.categoryRepository.find({});
  }

  // --- Banner CRUD ---
  async createBanner(title: string, imageUrl: string, link?: string): Promise<IBanner> {
    return this.bannerRepository.create({ title, imageUrl, link, isActive: true } as any);
  }

  async updateBanner(id: string, title: string, imageUrl: string, link?: string, isActive?: boolean): Promise<IBanner | null> {
    return this.bannerRepository.update(id, { title, imageUrl, link, isActive });
  }

  async deleteBanner(id: string): Promise<boolean> {
    await this.bannerRepository.delete(id);
    return true;
  }

  async getAllBanners(): Promise<IBanner[]> {
    return this.bannerRepository.find({});
  }

  // --- Disputes Management ---
  async raiseDispute(bookingId: string, raisedBy: string, reason: string): Promise<IDispute> {
    return this.disputeRepository.create({
      booking: bookingId as any,
      raisedBy: raisedBy as any,
      reason,
      status: DisputeStatus.PENDING,
    } as any);
  }

  async resolveDispute(disputeId: string, resolutionDetails: string): Promise<IDispute> {
    const dispute = await this.disputeRepository.findById(disputeId);
    if (!dispute) {
      throw new NotFoundError('Dispute not found');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolutionDetails = resolutionDetails;
    await dispute.save();

    return dispute;
  }

  async getAllDisputes(): Promise<IDispute[]> {
    return this.disputeRepository.findAllDetailed();
  }

  // --- Reports & Metrics ---
  async getDashboardStats(): Promise<{
    usersCount: number;
    bookingsCount: number;
    disputesCount: number;
    totalRevenue: number;
  }> {
    const [users, bookings, disputes] = await Promise.all([
      this.userRepository.find({}),
      this.bookingRepository.find({}),
      this.disputeRepository.find({}),
    ]);

    const totalRevenue = bookings
      .filter((b) => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      usersCount: users.length,
      bookingsCount: bookings.length,
      disputesCount: disputes.length,
      totalRevenue,
    };
  }
}

export const adminService = new AdminService();

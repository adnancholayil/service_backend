import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class CloudinaryService {
  async uploadImage(filePath: string, folder = 'servicehub'): Promise<string> {
    try {
      if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary not configured. Mocking image upload.');
        return 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=400';
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (error: any) {
      logger.error(`Cloudinary upload failed: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async uploadMultipleImages(filePaths: string[], folder = 'servicehub'): Promise<string[]> {
    const uploadPromises = filePaths.map((path) => this.uploadImage(path, folder));
    return Promise.all(uploadPromises);
  }
}

export const cloudinaryService = new CloudinaryService();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { upload } from '../middlewares/upload.middleware';
import { cloudinaryService } from '../services/cloudinary.service';
import { authenticate } from '../middlewares/auth.middleware';
import { errorHandler } from '../middlewares/error.middleware';
import { ValidationError } from '../utils/errors';

export const loadExpress = (app: Express): void => {
  // Global Middlewares
  app.use(
    cors({
      origin: '*', // Customize for production
      credentials: true,
    })
  );

  // Use helmet (disable contentSecurityPolicy in development so GraphQL Playground/Sandbox works)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Basic API Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
  });
  app.use('/api/', limiter);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // REST File Upload Endpoint
  app.post(
    '/api/upload',
    authenticate,
    upload.single('image'),
    async (req: Request, res: Response, next) => {
      try {
        if (!req.file) {
          throw new ValidationError('Please upload an image file');
        }

        // Upload to Cloudinary
        const imageUrl = await cloudinaryService.uploadImage(req.file.path, 'servicehub/images');
        
        // Remove temp file asynchronously
        import('fs').then((fs) => {
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        });

        res.status(200).json({
          status: 'success',
          url: imageUrl,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Global Error Handler
  app.use(errorHandler);
};
export default loadExpress;

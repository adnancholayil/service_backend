import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { upload } from '../middlewares/upload.middleware';
import path from 'path';
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

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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

        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

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

import { UserRole } from '../constants';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

export {}; // Ensure it's treated as a module

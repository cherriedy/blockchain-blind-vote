import { Admin } from '@prisma/client';

export {};

declare global {
  namespace Express {
    interface Request {
      admin?: Admin;
    }
  }
}

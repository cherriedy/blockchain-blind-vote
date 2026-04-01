import { Admin } from '@prisma/client';
import { AdminResponseDto } from './admin.dto';

export const toAdminResponseDto = (admin: Admin): AdminResponseDto => ({
  id: admin.id,
  walletAddress: admin.walletAddress,
  name: admin.name,
  role: admin.role,
  isActive: admin.isActive,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

export const toAdminResponseDtos = (admins: Admin[]) =>
  admins.map(toAdminResponseDto);
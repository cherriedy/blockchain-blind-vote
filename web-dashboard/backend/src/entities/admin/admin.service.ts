import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { VotingContextService } from '../../voting';
import { CreateAdminRequestDto, UpdateAdminRequestDto } from './dto';
import { AdminRole, Prisma } from '@prisma/client';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class AdminService {
  async getAll(search?: string, role?: AdminRole, currentAdminId?: string) {
    return prisma.admin.findMany({
      where: {
        AND: [
          currentAdminId ? { id: { not: currentAdminId } } : {},
          role ? { role } : {},
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { walletAddress: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
    });
  }

  async getById(id: string) {
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async create(data: CreateAdminRequestDto) {
    const wallet = data.walletAddress.trim().toLowerCase();

    const existing = await prisma.admin.findUnique({
      where: { walletAddress: wallet },
    });

    if (existing) {
      throw new ConflictException('Admin already exists');
    }

    return prisma.admin.create({
      data: {
        walletAddress: wallet,
        name: data.name,
        role: data.role,
      },
    });
  }

  async update(
    id: string,
    data: UpdateAdminRequestDto,
    currentAdminId: string,
  ) {
    if (id === currentAdminId && data.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    if (
      id === currentAdminId &&
      data.role &&
      data.role !== AdminRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You cannot demote yourself from SUPER_ADMIN',
      );
    }

    return prisma.admin.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const admin = await this.getById(id);
    if (admin.role === AdminRole.SUPER_ADMIN) {
      const superAdminCount = await prisma.admin.count({
        where: { role: AdminRole.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last SUPER_ADMIN');
      }
    }
    try {
      await prisma.admin.delete({ where: { id } });
      return { message: 'Admin deleted successfully', id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2014') {
          throw new BadRequestException(
            'This admin is currently part of an poll and cannot be removed.',
          );
        }
      }
      throw error;
    }
  }

  async findByWallet(walletAddress: string) {
    const wallet = walletAddress.trim().toLowerCase();

    return prisma.admin.findUnique({
      where: { walletAddress: wallet },
    });
  }
}

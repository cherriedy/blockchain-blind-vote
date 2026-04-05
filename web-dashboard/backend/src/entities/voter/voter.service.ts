import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Voter } from '@prisma/client';
import { VotingContextService } from '../../voting';
import { EventVoterService } from '../event';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class VoterService {
  constructor(
    @Inject(forwardRef(() => EventVoterService))
    private readonly eventVoterService: EventVoterService,
    private readonly votingContextService: VotingContextService,
  ) {}

  async findByWalletAddress(walletAddress: string): Promise<Voter | null> {
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);
    if (!normalizedWallet) {
      throw new BadRequestException('Invalid walletAddress');
    }
    return prisma.voter.findFirst({
      where: { walletAddress: normalizedWallet },
    });
  }

  async findByStudentId(studentId: string): Promise<Voter | null> {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    if (!normalizedStudentId) {
      throw new BadRequestException('Invalid studentId');
    }
    return prisma.voter.findFirst({
      where: { studentId: normalizedStudentId },
    });
  }

  async create(
    studentId: string,
    walletAddress: string,
    name: string,
    email: string,
    isActive = true,
    adminId?: string,
  ): Promise<{ message: string; voterId: string }> {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);

    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    if (!normalizedStudentId || !normalizedWallet) {
      throw new BadRequestException('Missing studentId or walletAddress');
    }

    const byStudent = await prisma.voter.findFirst({
      where: { studentId: normalizedStudentId },
    });

    const byWallet = await prisma.voter.findFirst({
      where: { walletAddress: normalizedWallet },
    });

    if (byStudent || byWallet) {
      throw new ConflictException('studentId or walletAddress already exists');
    }

    return prisma.$transaction(async (tx) => {
      const voter = await tx.voter.create({
        data: {
          studentId: normalizedStudentId,
          walletAddress: normalizedWallet,
          name,
          email,
          isActive,
        },
      });

      // audit log
      await tx.auditLog.create({
        data: {
          adminId: adminId!,
          action: 'CREATE_VOTER',
          targetType: 'VOTER',
          targetId: voter.id,
          details: {
            voter: {
              id: voter.id,
              name: voter.name,
              email: voter.email,
              studentId: voter.studentId,
              walletAddress: voter.walletAddress,
              isActive: voter.isActive,
            },
          },
        },
      });

      return {
        message: 'Voter created',
        voterId: voter.id,
      };
    });
  }

  async setVoterStatus(
    studentId: string,
    isActive: boolean,
  ): Promise<{ message: string; studentId: string; isActive: boolean }> {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);

    const voter = await prisma.voter.findFirst({
      where: { studentId: normalizedStudentId },
    });
    if (!voter) throw new NotFoundException('Voter not found');

    await prisma.voter.update({
      where: { id: voter.id },
      data: { isActive },
    });

    return {
      message: 'Voter status updated',
      studentId: normalizedStudentId,
      isActive,
    };
  }

  async getAll(search?: string) {
    return prisma.voter.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { studentId: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      take: search ? 10 : undefined,
    });
  }

  async setVoterStatusById(
    id: string,
    isActive: boolean,
    adminId: string,
    currentAdminWallet: string,
  ) {
    const voter = await prisma.voter.findUnique({ where: { id } });

    if (!voter) throw new NotFoundException('Voter not found');

    if (voter.walletAddress === currentAdminWallet) {
      throw new BadRequestException('You cannot update your own active status');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.voter.update({
        where: { id },
        data: { isActive },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_VOTER_STATUS',
          targetType: 'VOTER',
          targetId: id,
          details: {
            voter: {
              id: voter.id,
              name: voter.name,
              email: voter.email,
            },
            before: {
              isActive: voter.isActive,
            },
            after: {
              isActive: isActive,
            },
          },
        },
      });

      return {
        message: 'Voter status updated',
        voterId: id,
        isActive,
      };
    });
  }

  async getByStudentId(id: string) {
    const voter = await prisma.voter.findUnique({ where: { studentId: id } });
    if (!voter) throw new NotFoundException('Voter not found');
    return voter;
  }

  async delete(id: string, adminId: string) {
    const voter = await prisma.voter.findUnique({ where: { id } });
    if (!voter) throw new NotFoundException('Voter not found');

    return prisma.$transaction(async (tx) => {
      try {
        await tx.voter.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            adminId,
            action: 'DELETE_VOTER',
            targetType: 'VOTER',
            targetId: id,
            details: {
              voter: {
                id: voter.id,
                name: voter.name,
                email: voter.email,
                walletAddress: voter.walletAddress,
              },
            },
          },
        });

        return { message: 'Voter deleted successfully', id };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2014') {
            throw new BadRequestException(
              'This voter is currently part of an election and cannot be removed.',
            );
          }
        }
        throw error;
      }
    });
  }
}

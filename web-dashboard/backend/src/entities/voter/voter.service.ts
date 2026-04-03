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
  ) { }

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

    const voter = await prisma.voter.create({
      data: {
        studentId: normalizedStudentId,
        walletAddress: normalizedWallet,
        name,
        email,
        isActive,
      },
    });

    return { message: 'Voter created', voterId: voter.id };
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

  async setVoterStatusById(id: string, isActive: boolean, currentAdminWallet: string) {
    const voter = await prisma.voter.findUnique({ where: { id } });

    if (!voter) throw new NotFoundException('Voter not found');

    if (voter.walletAddress === currentAdminWallet) {
      throw new BadRequestException('You cannot update your own active status');
    }

    await prisma.voter.update({
      where: { id },
      data: { isActive }
    });

    return {
      message: 'Voter status updated',
      voterId: id,
      isActive
    };
  }

  async getByStudentId(id: string) {
    const voter = await prisma.voter.findUnique({ where: { studentId: id } });
    if (!voter) throw new NotFoundException('Voter not found');
    return voter;
  }

  async delete(id: string) {
    const voter = await prisma.voter.findUnique({ where: { id } });
    if (!voter) throw new NotFoundException('Voter not found');
    try {
      await prisma.voter.delete({ where: { id } });
      return { message: 'Voter deleted successfully', id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2014') {
          throw new BadRequestException(
            'This voter is currently part of an election and cannot be removed.'
          );
        }
      }
      throw error;
    }
  }
}

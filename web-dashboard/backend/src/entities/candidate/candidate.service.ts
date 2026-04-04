import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VotingContextService } from '../../voting';
import { CreateCandidateRequestDto, UpdateCandidateRequestDto } from './dto';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class CandidateService {
  constructor(private readonly votingContextService: VotingContextService) {}

  async getAll(search?: string) {
    return prisma.candidate.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { studentId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
    });
  }

  async getById(id: string) {
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async getByWallet(walletAddress: string) {
    const normalizedWallet = walletAddress.toLowerCase();

    return prisma.candidate.findUnique({
      where: { walletAddress: normalizedWallet },
    });
  }

  async create(data: CreateCandidateRequestDto, adminId: string) {
    const normalizedWallet = this.votingContextService.normalizeWalletAddress(
      data.walletAddress,
    );
    const normalizedStudentId = this.votingContextService.normalizeStudentId(
      data.studentId,
    );

    return prisma.$transaction(async (tx) => {
      const candidate = await tx.candidate.create({
        data: {
          studentId: normalizedStudentId,
          name: data.name,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
          walletAddress: normalizedWallet,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'CREATE_CANDIDATE',
          targetType: 'CANDIDATE',
          targetId: candidate.id,
          details: {
            candidate: {
              id: candidate.id,
              name: candidate.name,
              studentId: candidate.studentId,
            },
          },
        },
      });

      return candidate;
    });
  }

  /**
   * Find a candidate by both walletAddress and studentId.
   * Returns null if no matching record exists.
   */
  async findByWalletAddressAndStudentId(
    walletAddress: string,
    studentId: string,
  ) {
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    return prisma.candidate.findFirst({
      where: {
        walletAddress: normalizedWallet,
        studentId: normalizedStudentId,
      },
    });
  }

  /**
   * Allow an eligible voter to create their own Candidate profile.
   * Verifies that an active Voter record exists with the given walletAddress AND studentId.
   * Throws if no voter found, voter is inactive, or a candidate profile already exists.
   */
  async registerAsCandidate(dto: CreateCandidateRequestDto) {
    const normalizedWallet = this.votingContextService.normalizeWalletAddress(
      dto.walletAddress,
    );
    const normalizedStudentId = this.votingContextService.normalizeStudentId(
      dto.studentId,
    );

    if (!normalizedWallet || !normalizedStudentId) {
      throw new BadRequestException('walletAddress and studentId are required');
    }

    // Verify the voter exists with matching walletAddress AND studentId
    const voter = await prisma.voter.findFirst({
      where: {
        walletAddress: normalizedWallet,
        studentId: normalizedStudentId,
      },
    });
    if (!voter) {
      throw new NotFoundException(
        'No eligible voter found with the provided walletAddress and studentId.',
      );
    }
    if (!voter.isActive) {
      throw new ForbiddenException(
        'Your voter account is not active. Please contact an administrator.',
      );
    }

    // Prevent duplicate candidate profile
    const existing = await prisma.candidate.findFirst({
      where: { walletAddress: normalizedWallet },
    });
    if (existing) {
      throw new ConflictException(
        'A candidate profile already exists for this wallet address.',
      );
    }

    return prisma.candidate.create({
      data: {
        studentId: normalizedStudentId,
        walletAddress: normalizedWallet,
        name: dto.name,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
      },
    });
  }

  async update(id: string, data: UpdateCandidateRequestDto, adminId: string) {
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Candidate not found');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.candidate.update({
        where: { id },
        data,
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'UPDATE_CANDIDATE',
          targetType: 'CANDIDATE',
          targetId: id,
          details: {
            before: {
              name: existing.name,
              studentId: existing.studentId,
              bio: existing.bio,
            },
            after: {
              name: updated.name,
              studentId: updated.studentId,
              bio: updated.bio,
            },
          },
        },
      });

      return updated;
    });
  }

  async delete(id: string, adminId: string) {
    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Candidate not found');

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.candidate.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'DELETE_CANDIDATE',
          targetType: 'CANDIDATE',
          targetId: id,
          details: {
            candidate: {
              id: existing.id,
              name: existing.name,
              studentId: existing.studentId,
            },
          },
        },
      });

      return deleted;
    });
  }
}

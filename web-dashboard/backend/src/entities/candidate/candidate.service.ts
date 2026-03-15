import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { VotingContextService } from '../../voting';
import { CreateCandidateRequestDto, UpdateCandidateRequestDto } from './dto';

@Injectable()
export class CandidateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly votingContextService: VotingContextService,
  ) {}

  async getAll() {
    return this.prisma.candidate.findMany();
  }

  async getById(id: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async create(data: CreateCandidateRequestDto) {
    const normalizedWallet = this.votingContextService.normalizeWalletAddress(
      data.walletAddress,
    );
    const normalizedStudentId = this.votingContextService.normalizeStudentId(
      data.studentId,
    );
    return this.prisma.candidate.create({
      data: {
        studentId: normalizedStudentId,
        name: data.name,
        bio: data.bio,
        avatarUrl: data.avatarUrl,
        walletAddress: normalizedWallet,
      },
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
    return this.prisma.candidate.findFirst({
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
    const voter = await this.prisma.voter.findFirst({
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
    const existing = await this.prisma.candidate.findFirst({
      where: { walletAddress: normalizedWallet },
    });
    if (existing) {
      throw new ConflictException(
        'A candidate profile already exists for this wallet address.',
      );
    }

    return this.prisma.candidate.create({
      data: {
        studentId: normalizedStudentId,
        walletAddress: normalizedWallet,
        name: dto.name,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
      },
    });
  }

  async update(id: string, data: UpdateCandidateRequestDto) {
    return this.prisma.candidate.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.candidate.delete({ where: { id } });
  }
}

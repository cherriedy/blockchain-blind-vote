import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Voter } from '@prisma/client';
import { VotingContextService } from '../../voting';
import { EventVoterService } from '../event';
import { PrismaService } from '../../prisma';

@Injectable()
export class VoterService {
  constructor(
    private readonly prisma: PrismaService,
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
    return this.prisma.voter.findFirst({
      where: { walletAddress: normalizedWallet },
    });
  }

  async findByStudentId(studentId: string): Promise<Voter | null> {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    if (!normalizedStudentId) {
      throw new BadRequestException('Invalid studentId');
    }
    return this.prisma.voter.findFirst({
      where: { studentId: normalizedStudentId },
    });
  }

  async create(
    studentId: string,
    walletAddress: string,
    isActive = true,
  ): Promise<{ message: string; voterId: string }> {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    if (!normalizedStudentId || !normalizedWallet) {
      throw new BadRequestException('Missing studentId or walletAddress');
    }

    const byStudent = await this.prisma.voter.findFirst({
      where: { studentId: normalizedStudentId },
    });
    const byWallet = await this.prisma.voter.findFirst({
      where: { walletAddress: normalizedWallet },
    });

    if (byStudent || byWallet) {
      throw new ConflictException('studentId or walletAddress already exists');
    }

    const voter = await this.prisma.voter.create({
      data: {
        studentId: normalizedStudentId,
        walletAddress: normalizedWallet,
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

    const voter = await this.prisma.voter.findFirst({
      where: { studentId: normalizedStudentId },
    });
    if (!voter) throw new NotFoundException('Voter not found');

    await this.prisma.voter.update({
      where: { id: voter.id },
      data: { isActive },
    });

    return {
      message: 'Voter status updated',
      studentId: normalizedStudentId,
      isActive,
    };
  }

  async getAll() {
    return this.prisma.voter.findMany();
  }

  async getById(id: string) {
    const voter = await this.prisma.voter.findUnique({ where: { id } });
    if (!voter) throw new NotFoundException('Voter not found');
    return voter;
  }

  async setVoterStatusById(id: string, isActive: boolean) {
    const voter = await this.prisma.voter.findUnique({ where: { id } });
    if (!voter) throw new NotFoundException('Voter not found');
    await this.prisma.voter.update({ where: { id }, data: { isActive } });
    return { message: 'Voter status updated', id, isActive };
  }

  async update(
    id: string,
    dto: {
      studentId: string;
      walletAddress: string;
      isActive?: boolean;
    },
  ) {
    const voter = await this.prisma.voter.findUnique({ where: { id } });
    if (!voter) throw new NotFoundException('Voter not found');
    await this.prisma.voter.update({ where: { id }, data: dto });
    return { message: 'Voter updated', id };
  }

  async delete(id: string) {
    const voter = await this.prisma.voter.findUnique({ where: { id } });
    if (!voter) throw new NotFoundException('Voter not found');
    await this.prisma.voter.delete({ where: { id } });
    return { message: 'Voter deleted', id };
  }
}

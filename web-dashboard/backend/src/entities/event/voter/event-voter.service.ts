import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventVoter } from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { VoterService } from '../../voter';
import { UpsertEventVoterRequestDto } from './dto';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class EventVoterService {
  constructor(
    @Inject(forwardRef(() => VoterService))
    private readonly voterService: VoterService,
  ) {}

  async findEventByType(
    voteType: VotingEventType,
    voteId: string,
  ): Promise<EventVoter | null> {
    return prisma.eventVoter.findFirst({ where: { voteType, voteId } });
  }

  async findAllByEvent(
    voteType: VotingEventType,
    voteId: string,
  ): Promise<EventVoter[]> {
    return prisma.eventVoter.findMany({
      where: { voteType, voteId },
      include: { voter: true },
    });
  }

  async findEligibleEventVoter(
    voteType: VotingEventType,
    voteId: string,
    voterId: string,
  ): Promise<EventVoter | null> {
    return prisma.eventVoter.findFirst({
      where: { voteType, voteId, voterId, canVote: true },
    });
  }

  async upsert(data: UpsertEventVoterRequestDto): Promise<EventVoter> {
    const { voteType, voteId, voterId, canVote = true } = data;

    if (!voteType || !voteId || !voterId) {
      throw new BadRequestException(
        'voteType, voteId, and voterId are required',
      );
    }

    return prisma.eventVoter.upsert({
      where: { voteType_voteId_voterId: { voteType, voteId, voterId } },
      update: { canVote },
      create: { voteType, voteId, voterId, canVote },
    });
  }

  async delete(
    studentId: string,
    voteType: VotingEventType,
    voteId: string,
  ): Promise<string> {
    const voter = await this.voterService.findByStudentId(studentId);
    if (!voter) throw new NotFoundException('Voter not found');

    await prisma.eventVoter.deleteMany({
      where: { voteType, voteId, voterId: voter.id },
    });
    return 'Event voter removed';
  }

  async deleteByVoterId(
    voterId: string,
    voteType: VotingEventType,
    voteId: string,
  ): Promise<string> {
    await prisma.eventVoter.deleteMany({
      where: { voteType, voteId, voterId },
    });
    return 'Event voter removed';
  }
}

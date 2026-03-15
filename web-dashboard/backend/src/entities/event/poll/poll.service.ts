import { Injectable, NotFoundException } from '@nestjs/common';
import { EventVoter, Poll } from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { PrismaService } from '../../../prisma';
import { EventVoterService } from '../voter';
import { VotingContextService } from '../../../voting';
import { CreatePollRequestDto, UpdatePollRequestDto } from './dto';

@Injectable()
export class PollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventVoterService: EventVoterService,
    private readonly votingContextService: VotingContextService,
  ) {}

  /**
   * List all polls.
   * @returns An array of poll documents.
   */
  async getAll(): Promise<Poll[]> {
    return this.prisma.poll.findMany();
  }

  /**
   * Get a poll by MongoDB document id.
   * @param id - Poll document id.
   * @returns The poll document or null if not found.
   */
  async getById(id: string): Promise<Poll | null> {
    return this.prisma.poll.findUnique({ where: { id } });
  }

  /**
   * Create a poll document.
   * @param data - Poll payload.
   * @returns The created poll document.
   */
  async create(data: CreatePollRequestDto): Promise<Poll> {
    return this.prisma.poll.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        visibility: data.visibility,
        isAutomatic: data.isAutomatic ?? false,
        startAt: data.startAt,
        endAt: data.endAt,
        question: data.question,
        options: data.options ?? [],
        votes: [],
      },
    });
  }

  /**
   * Update a poll document.
   * @param id - Poll document id.
   * @param data - Partial payload.
   * @returns The updated poll document.
   * @throws NotFoundException if the poll does not exist.
   */
  async update(id: string, data: UpdatePollRequestDto): Promise<Poll> {
    const existing = await this.prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    return this.prisma.poll.update({ where: { id }, data });
  }

  /**
   * Delete a poll document.
   * @param id - Poll document id.
   * @returns The deleted poll document.
   * @throws NotFoundException if the poll does not exist.
   */
  async delete(id: string): Promise<Poll> {
    const existing = await this.prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    return this.prisma.poll.delete({ where: { id } });
  }

  /**
   * List all voters assigned to a poll.
   * @param id - The ID of the poll.
   * @returns An array of EventVoter records.
   * @throws NotFoundException if the poll does not exist.
   */
  async listVoters(id: string): Promise<EventVoter[]> {
    const existing = await this.prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    return this.eventVoterService.findAllByEvent(VotingEventType.POLL, id);
  }

  /**
   * Assign (or update) a voter for a poll.
   * @param id - The ID of the poll.
   * @param voterId - The voter document ID.
   * @param canVote - Whether the voter is allowed to vote. Defaults to true.
   * @returns The created/updated EventVoter record.
   * @throws NotFoundException if the poll does not exist.
   */
  async assignVoter(
    id: string,
    voterId: string,
    canVote = true,
  ): Promise<EventVoter> {
    const existing = await this.prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    return this.eventVoterService.upsert({
      voteType: VotingEventType.POLL,
      voteId: id,
      voterId,
      canVote,
    });
  }

  /**
   * Remove a voter from a poll.
   * @param id - The ID of the poll.
   * @param voterId - The voter document ID to remove.
   * @returns A confirmation message.
   * @throws NotFoundException if the poll does not exist.
   */
  async removeVoter(id: string, voterId: string): Promise<string> {
    const existing = await this.prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    return this.eventVoterService.deleteByVoterId(
      voterId,
      VotingEventType.POLL,
      id,
    );
  }

  /**
   * Retrieve all polls the voter is eligible to participate in.
   * @param walletAddress - The voter's wallet address.
   * @param studentId - The voter's student ID.
   * @returns Array of polls assigned to this voter.
   * @throws NotFoundException if no voter matches the provided credentials.
   */
  async getEligiblePolls(
    walletAddress: string,
    studentId: string,
  ): Promise<Poll[]> {
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);

    const voter = await this.prisma.voter.findFirst({
      where: {
        walletAddress: normalizedWallet,
        studentId: normalizedStudentId,
      },
    });
    if (!voter) throw new NotFoundException('Voter not found');

    const eventVoters = await this.prisma.eventVoter.findMany({
      where: { voterId: voter.id, voteType: VotingEventType.POLL },
    });

    const pollIds = eventVoters.map((ev: EventVoter) => ev.voteId);
    if (pollIds.length === 0) return [];

    return this.prisma.poll.findMany({
      where: { id: { in: pollIds } },
    });
  }
}

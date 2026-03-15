import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Candidate, Election, EventVoter } from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { PrismaService } from '../../../prisma';
import { EventVoterService } from '../voter';
import { VotingContextService } from '../../../voting';
import { CreateElectionRequestDto, UpdateElectionRequestDto } from './dto';
import { CandidateService } from '../../candidate';

@Injectable()
export class ElectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventVoterService: EventVoterService,
    private readonly candidateService: CandidateService,
    private readonly votingContextService: VotingContextService,
  ) {}

  /**
   * Retrieve all candidate profiles for an election, separated into
   * admin-assigned and self-nominated groups.
   * @param id - The ID of the election.
   * @returns Object with `assigned` and `selfNominated` Candidate arrays.
   * @throws NotFoundException if the election does not exist.
   */
  async getCandidates(
    id: string,
  ): Promise<{ assigned: Candidate[]; selfNominated: Candidate[] }> {
    const election = await this.prisma.election.findUnique({ where: { id } });
    if (!election) throw new NotFoundException('Election not found');

    const assignedIds = election.candidateIds ?? [];
    const selfNominatedIds = election.selfNominatedCandidates ?? [];
    const allIds = [...new Set([...assignedIds, ...selfNominatedIds])];

    if (allIds.length === 0) return { assigned: [], selfNominated: [] };

    const allCandidates = await this.prisma.candidate.findMany({
      where: { id: { in: allIds } },
    });

    const candidateMap = new Map(
      allCandidates.map((c: Candidate) => [c.id, c]),
    );

    return {
      assigned: assignedIds
        .map((cid: string) => candidateMap.get(cid))
        .filter((c: Candidate | undefined): c is Candidate => c !== undefined),
      selfNominated: selfNominatedIds
        .map((cid: string) => candidateMap.get(cid))
        .filter((c: Candidate | undefined): c is Candidate => c !== undefined),
    };
  }

  /**
   * Retrieve a single election by its ID.
   * @param id - The ID of the election to retrieve.
   * @returns The election object if found, or null.
   */
  async getById(id: string): Promise<Election | null> {
    return this.prisma.election.findUnique({ where: { id } });
  }

  /**
   * Retrieve all elections.
   * @returns An array of all election objects.
   */
  async getAll(): Promise<Election[]> {
    return this.prisma.election.findMany();
  }

  /**
   * Create a new election.
   * @param data - The data for the new election.
   * @returns The created election object.
   */
  async create(data: CreateElectionRequestDto): Promise<Election> {
    return this.prisma.election.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        visibility: data.visibility,
        isAutomatic: data.isAutomatic ?? false,
        startAt: data.startAt,
        endAt: data.endAt,
        candidateIds: data.candidateIds ?? [],
        allowSelfNomination: data.allowSelfNomination ?? false,
        selfNominatedCandidates: [],
        votes: data.votes ?? {},
      },
    });
  }

  /**
   * Update an existing election.
   * @param id - The ID of the election to update.
   * @param data - The new data for the election.
   * @returns The updated election object.
   * @throws NotFoundException if the election does not exist.
   */
  async update(id: string, data: UpdateElectionRequestDto): Promise<Election> {
    const existing = await this.prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.prisma.election.update({ where: { id }, data });
  }

  /**
   * Delete an election by its ID.
   * @param id - The ID of the election to delete.
   * @returns The deleted election object.
   * @throws NotFoundException if the election does not exist.
   */
  async delete(id: string): Promise<Election> {
    const existing = await this.prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.prisma.election.delete({ where: { id } });
  }

  /**
   * List all voters assigned to an election.
   * @param id - The ID of the election.
   * @returns An array of EventVoter records.
   * @throws NotFoundException if the election does not exist.
   */
  async listVoters(id: string): Promise<EventVoter[]> {
    const existing = await this.prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.eventVoterService.findAllByEvent(VotingEventType.ELECTION, id);
  }

  /**
   * Assign (or update) a voter for an election.
   * @param id - The ID of the election.
   * @param voterId - The voter document ID.
   * @param canVote - Whether the voter is allowed to vote. Defaults to true.
   * @returns The created/updated EventVoter record.
   * @throws NotFoundException if the election does not exist.
   */
  async assignVoter(
    id: string,
    voterId: string,
    canVote = true,
  ): Promise<EventVoter> {
    const existing = await this.prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.eventVoterService.upsert({
      voteType: VotingEventType.ELECTION,
      voteId: id,
      voterId,
      canVote,
    });
  }

  /**
   * Remove a voter from an election.
   * @param id - The ID of the election.
   * @param voterId - The voter document ID to remove.
   * @returns A confirmation message.
   * @throws NotFoundException if the election does not exist.
   */
  async removeVoter(id: string, voterId: string): Promise<string> {
    const existing = await this.prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.eventVoterService.deleteByVoterId(
      voterId,
      VotingEventType.ELECTION,
      id,
    );
  }

  /**
   * Self-nominate a candidate for an election.
   * @param electionId - The ID of the election.
   * @param walletAddress - The wallet address of the voter wishing to self-nominate.
   * @param studentId - The student ID of the voter wishing to self-nominate.
   * @returns The updated election object.
   * @throws NotFoundException if the election does not exist or no matching candidate profile is found.
   * @throws BadRequestException if self-nomination is not allowed or the candidate is already nominated.
   */
  async selfNominate(
    electionId: string,
    walletAddress: string,
    studentId: string,
  ): Promise<Election> {
    const election = await this.prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) throw new NotFoundException('Election not found');
    if (!election.allowSelfNomination) {
      throw new BadRequestException(
        'Self-nomination is not allowed for this election',
      );
    }

    // Verify a candidate profile exists matching both walletAddress and studentId
    const candidate =
      await this.candidateService.findByWalletAddressAndStudentId(
        walletAddress,
        studentId,
      );
    if (!candidate) {
      throw new NotFoundException(
        'No candidate profile found for the provided walletAddress and studentId. ' +
          'Please create your candidate profile first via POST /candidates/register.',
      );
    }

    // Prevent duplicate nominations
    if (
      election.candidateIds.includes(candidate.id) ||
      (election.selfNominatedCandidates || []).includes(candidate.id)
    ) {
      throw new BadRequestException(
        'This candidate is already nominated for this election',
      );
    }

    return this.prisma.election.update({
      where: { id: electionId },
      data: {
        selfNominatedCandidates: {
          set: [...(election.selfNominatedCandidates || []), candidate.id],
        },
      },
    });
  }

  /**
   * Retrieve all elections the voter is eligible to participate in.
   * @param walletAddress - The voter's wallet address.
   * @param studentId - The voter's student ID.
   * @returns Array of elections assigned to this voter.
   * @throws NotFoundException if no voter matches the provided credentials.
   */
  async getEligibleElections(
    walletAddress: string,
    studentId: string,
  ): Promise<Election[]> {
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
      where: { voterId: voter.id, voteType: VotingEventType.ELECTION },
    });

    const electionIds = eventVoters.map((ev: EventVoter) => ev.voteId);
    if (electionIds.length === 0) return [];

    return this.prisma.election.findMany({
      where: { id: { in: electionIds } },
    });
  }
}

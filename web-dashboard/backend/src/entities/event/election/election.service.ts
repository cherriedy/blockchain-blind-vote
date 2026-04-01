import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Admin, AdminRole, Candidate, Election, EventVoter, SelfNomination } from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { EventVoterService } from '../voter';
import { VotingContextService } from '../../../voting';
import { CreateElectionRequestDto, SelfNominateDto, UpdateElectionRequestDto } from './dto';
import { CandidateService } from '../../candidate';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class ElectionService {
  constructor(
    private readonly eventVoterService: EventVoterService,
    private readonly candidateService: CandidateService,
    private readonly votingContextService: VotingContextService,
  ) { }


  async getCandidates(
    id: string,
  ): Promise<{ assigned: Candidate[]; selfNominated: Candidate[] }> {
    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) throw new NotFoundException('Election not found');

    const assignedCandidates = await prisma.candidate.findMany({
      where: { id: { in: election.candidateIds } },
    });

    const selfNominated = await prisma.selfNomination.findMany({
      where: { electionId: election.id, status: 'PENDING' },
      include: { candidate: true },
    });

    return { assigned: assignedCandidates, selfNominated: selfNominated.map(sn => sn.candidate) };
  }

  /**
   * Retrieve a single election by its ID.
   * @param id - The ID of the election to retrieve.
   * @returns The election object if found.
   * @throws NotFoundException if the election is not found.
   */
  async getById(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
    });

    if (!election) throw new NotFoundException('Election not found');
    return election;
  }

  /**
   * Check if an admin is assigned to a specific election.
   * @param adminId - The ID of the admin.
   * @param electionId - The ID of the election.
   * @returns A boolean indicating whether the admin is assigned to the election.
   */
  async isAdminAssignedToElection(
    adminId: string,
    electionId: string,
  ): Promise<boolean> {
    const assignment = await prisma.eventAdmin.findFirst({
      where: {
        adminId,
        voteType: 'ELECTION',
        voteId: electionId,
      },
    });
    return !!assignment;
  }

  /**
   * Retrieve all elections, optionally filtered by visibility.
   * @param query - Optional query object to filter elections by visibility.
   * @returns An array of election objects matching the criteria.
   * @throws BadRequestException if an invalid visibility filter is provided.
   * Valid visibility values are 'public' and 'private'.
   */
  async getAll(admin: Admin, query?: { visibility?: string }): Promise<Election[]> {
    const where: any = {};

    // Filter by visibility if provided
    if (query?.visibility) {
      if (query.visibility === 'public' || query.visibility === 'private') {
        where.visibility = query.visibility;
      } else {
        throw new BadRequestException(
          'Invalid visibility filter. Valid values are "public" or "private".',
        );
      }
    }

    // Nếu là ELECTION_ADMIN, chỉ lấy các election được gán
    if (admin.role === AdminRole.ELECTION_ADMIN) {
      const assigned = await prisma.eventAdmin.findMany({
        where: {
          adminId: admin.id,
          voteType: 'ELECTION',
        },
        select: { voteId: true },
      });

      const electionIds = assigned.map(e => e.voteId);
      where.id = { in: electionIds };
    } else if (admin.role === AdminRole.SUPER_ADMIN) {
      // SUPER_ADMIN xem tất cả -> không cần filter thêm
    } else {
      throw new BadRequestException('Admin does not have permission to view elections');
    }

    return prisma.election.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new election.
   * @param data - The data for the new election.
   * @returns The created election object.
   */
  async create(data: CreateElectionRequestDto): Promise<Election> {
    return prisma.election.create({
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
    const existing = await prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return prisma.election.update({ where: { id }, data });
  }

  /**
   * Delete an election by its ID.
   * @param id - The ID of the election to delete.
   * @returns The deleted election object.
   * @throws NotFoundException if the election does not exist.
   */
  async delete(id: string): Promise<Election> {
    const existing = await prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return prisma.election.delete({ where: { id } });
  }

  /**
   * List all voters assigned to an election.
   * @param id - The ID of the election.
   * @returns An array of EventVoter records.
   * @throws NotFoundException if the election does not exist.
   */
  async listVoters(id: string): Promise<EventVoter[]> {
    const existing = await prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.eventVoterService.findAllByEvent(VotingEventType.ELECTION, id,);
  }

  /**
   * Assign voters to an election.
   * @param id - The ID of the election.
   * @param voterIds - An array of voter document IDs to assign.
   * @param canVote - Optional boolean to set voting rights for the assigned voters (default: true).
   * @returns A summary of the assignment operation, including counts of assigned and skipped voters.
   * @throws NotFoundException if the election does not exist.
   * @throws BadRequestException if no valid voters are found or if all selected voters are already assigned.
   */
  async assignVoters(
    id: string,
    voterIds: string[],
    canVote = true,
  ): Promise<any> {
    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) throw new NotFoundException('Election not found');

    const existingVoters = await prisma.voter.findMany({
      where: { id: { in: voterIds } },
      select: { id: true },
    });

    const existingVoterIds = existingVoters.map((v) => v.id);
    if (existingVoterIds.length === 0) {
      throw new BadRequestException('No valid voters found in system');
    }

    // Check for already assigned voters to avoid duplicates
    const alreadyAssigned = await prisma.eventVoter.findMany({
      where: {
        voteId: id,
        voterId: { in: existingVoterIds },
        voteType: VotingEventType.ELECTION,
      },
      select: { voterId: true },
    });

    // Extract voterIds that are already assigned to this election
    const alreadyAssignedIds = alreadyAssigned.map((av) => av.voterId);

    // Filter out already assigned voters
    const newVoterIds = existingVoterIds.filter(
      (vid) => !alreadyAssignedIds.includes(vid),
    );

    if (newVoterIds.length === 0) {
      return {
        message: 'All selected voters were already assigned to this election',
        count: 0
      };
    }

    const dataToInsert = newVoterIds.map((vId) => ({
      voteType: VotingEventType.ELECTION,
      voteId: id,
      voterId: vId,
      canVote: canVote,
    }));

    return prisma.eventVoter.createMany({
      data: dataToInsert,
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
    const existing = await prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    return this.eventVoterService.deleteByVoterId(
      voterId,
      VotingEventType.ELECTION,
      id,
    );
  }

  /**
   * List all admins assigned to an election.
   * @param electionId - The ID of the election.
   * @return An array of Admin records assigned to the election.
   * @throws NotFoundException if the election does not exist.
   */
  async listAdmins(electionId: string) {
    const existing = await prisma.election.findUnique({ where: { id: electionId } });
    if (!existing) throw new NotFoundException('Election not found');

    return prisma.eventAdmin.findMany({
      where: {
        voteType: 'ELECTION',
        voteId: electionId,
      },
      include: {
        admin: true,
      },
    });
  }

  /**
   * Assign admins to an election.
   * @param id - The ID of the election.
   * @param adminIds - An array of admin document IDs to assign.
   * @returns The updated election object with assigned admins.
   * @throws NotFoundException if the election does not exist or if any admin ID is invalid.
   * @throws BadRequestException if any of the admins do not have the ELECTION_ADMIN role.
   */
  async assignAdmins(electionId: string, adminIds: string[]): Promise<any> {
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });
    if (!election) throw new NotFoundException('Election not found');

    const admins = await prisma.admin.findMany({
      where: { id: { in: adminIds } },
    });
    if (admins.length !== adminIds.length) {
      throw new BadRequestException('One or more Admin IDs are invalid');
    }

    // Check if all admins have the ELECTION_ADMIN and SUPER_ADMIN role
    const invalidAdmins = admins.filter(
      a => a.role !== AdminRole.ELECTION_ADMIN && a.role !== AdminRole.SUPER_ADMIN
    );

    if (invalidAdmins.length > 0) {
      const invalidNames = invalidAdmins.map(a => a.name).join(', ');
      throw new BadRequestException(
        `Cannot assign. The following admins do not have required roles: ${invalidNames}`
      );
    }

    const existingAssignments = await prisma.eventAdmin.findMany({
      where: {
        voteType: 'ELECTION',
        voteId: electionId,
        adminId: { in: adminIds },
      },
      select: { adminId: true },
    });

    const assignedAdminIds = existingAssignments.map((a) => a.adminId);

    const newAdminIds = adminIds.filter(
      (adminId) => !assignedAdminIds.includes(adminId),
    );

    if (newAdminIds.length > 0) {
      await prisma.eventAdmin.createMany({
        data: newAdminIds.map((adminId) => ({
          adminId,
          voteType: 'ELECTION',
          voteId: electionId,
        })),
      });
    }

    return prisma.election.findUniqueOrThrow({
      where: { id: electionId }
    });
  }

  /**
   * Remove an admin from an election.
   * @param id - The ID of the election.
   * @param adminId - The ID of the admin to remove.
   * @returns A confirmation message.
   * @throws NotFoundException if the election or admin does not exist.
   * @throws BadRequestException if the admin is not assigned to the election.
   */
  async removeAdmin(electionId: string, adminId: string) {
    try {
      await prisma.eventAdmin.delete({
        where: {
          adminId_voteType_voteId: {
            adminId,
            voteType: 'ELECTION',
            voteId: electionId,
          },
        },
      });
      return 'Removed successfully';
    } catch (error) {
      throw new BadRequestException('Assignment not found');
    }
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
    data: SelfNominateDto,
  ): Promise<SelfNomination> {
    const { walletAddress, studentId, introduction } = data;

    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    if (!election.allowSelfNomination) {
      throw new BadRequestException('Self-nomination is not allowed for this election');
    }

    // Verify candidate profile exists for the given wallet address and student ID
    const candidate = await this.candidateService.findByWalletAddressAndStudentId(
      walletAddress,
      studentId,
    );

    if (!candidate) {
      throw new NotFoundException(
        'Candidate profile not found. Please register your profile first.'
      );
    }

    // Check if candidate is already in the official candidate list
    if (election.candidateIds.includes(candidate.id)) {
      throw new BadRequestException(
        'You are already in the official candidate list for this election'
      );
    }

    // Check if the candidate has already self-nominated for this election (pending status)
    const existingNomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: {
          electionId: electionId,
          candidateId: candidate.id,
        },
      },
    });

    if (existingNomination) {
      throw new BadRequestException('You have already submitted a nomination for this election');
    }

    return prisma.selfNomination.create({
      data: {
        electionId: electionId,
        candidateId: candidate.id,
        introduction: introduction || null,
        status: 'PENDING',
      },
      include: {
        candidate: true,
      },
    });
  }

  async getSelfNominations(electionId: string) {
    return prisma.selfNomination.findMany({
      where: {
        electionId: electionId,
      },
      include: {
        candidate: true
      }
    });
  }

  async approveSelfNominee(
    electionId: string,
    candidateId: string,
    adminId: string
  ) {
    const nomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: { electionId, candidateId }
      }
    });

    if (!nomination) throw new NotFoundException('Nomination application not found.');
    if (nomination.status !== 'PENDING') {
      throw new BadRequestException('This application has already been processed.');
    }

    return prisma.$transaction(async (tx) => {
      // Update the nomination status
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: { status: 'APPROVED' }
      });

      // Add the candidate to the election's candidateIds array
      await tx.election.update({
        where: { id: electionId },
        data: {
          candidateIds: {
            push: candidateId
          }
        }
      });

      // Create Audit Log
      return tx.auditLog.create({
        data: {
          adminId,
          action: 'APPROVE_SELF_NOMINATION',
          targetType: 'ELECTION',
          targetId: electionId,
          details: {
            candidateId,
            nominationId: nomination.id,
            previousStatus: 'PENDING',
            newStatus: 'APPROVED'
          }
        }
      });
    });
  }

  async rejectSelfNominee(
    electionId: string,
    candidateId: string,
    adminId: string,
    adminNotes?: string
  ) {
    const nomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: { electionId, candidateId }
      }
    });

    if (!nomination) throw new NotFoundException('Nomination application not found.');
    if (nomination.status !== 'PENDING') {
      throw new BadRequestException('This application has already been processed.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update status and notes
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: {
          status: 'REJECTED',
          adminNotes: adminNotes || 'Does not meet requirements'
        }
      });

      // 2. Create Audit Log
      return tx.auditLog.create({
        data: {
          adminId,
          action: 'REJECT_SELF_NOMINATION',
          targetType: 'ELECTION',
          targetId: electionId,
          details: {
            candidateId,
            nominationId: nomination.id,
            reason: adminNotes || 'Does not meet requirements'
          }
        }
      });
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

    const voter = await prisma.voter.findFirst({
      where: {
        walletAddress: normalizedWallet,
        studentId: normalizedStudentId,
      },
    });
    if (!voter) throw new NotFoundException('Voter not found');

    const eventVoters = await prisma.eventVoter.findMany({
      where: { voterId: voter.id, voteType: VotingEventType.ELECTION },
    });

    const electionIds = eventVoters.map((ev: EventVoter) => ev.voteId);
    if (electionIds.length === 0) return [];

    return prisma.election.findMany({
      where: { id: { in: electionIds } },
    });
  }
}

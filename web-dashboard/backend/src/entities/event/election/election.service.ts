import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Admin,
  AdminRole,
  Candidate,
  Election,
  EventVoter,
  SelfNomination,
  SelfNominationStatus,
} from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { EventVoterService } from '../voter';
import { VotingContextService } from '../../../voting';
import {
  CreateElectionRequestDto,
  ResubmitSelfNominateDto,
  SelfNominateDto,
  UpdateElectionRequestDto,
} from './dto';
import { CandidateService } from '../../candidate';
import { prisma } from 'prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { buildEmailTemplate } from 'src/mail/template';
import { E } from 'node_modules/@faker-js/faker/dist/airline-eVQV6kbz';

@Injectable()
export class ElectionService {
  constructor(
    private readonly eventVoterService: EventVoterService,
    private readonly candidateService: CandidateService,
    private readonly votingContextService: VotingContextService,
    private readonly mailService: MailService,
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

    return {
      assigned: assignedCandidates,
      selfNominated: selfNominated.map((sn) => sn.candidate),
    };
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
  async getAll(
    admin: Admin,
    query?: { visibility?: string; search?: string },
  ): Promise<Election[]> {
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

    // Search
    if (query?.search) {
      const orConditions: any[] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { status: { contains: query.search, mode: 'insensitive' } },
      ];

      // chỉ add id nếu hợp lệ
      if (/^[a-fA-F0-9]{24}$/.test(query.search)) {
        orConditions.push({
          id: query.search,
        });
      }

      where.OR = orConditions;
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

      const electionIds = assigned.map((e) => e.voteId);
      where.id = { in: electionIds };
    } else if (admin.role === AdminRole.SUPER_ADMIN) {
      // SUPER_ADMIN xem tất cả -> không cần filter thêm
    } else {
      throw new BadRequestException(
        'Admin does not have permission to view elections',
      );
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
  async update(
    id: string,
    data: UpdateElectionRequestDto,
    adminId: string,
  ): Promise<Election> {
    const existing = await prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    if (existing.status !== 'pending') {
      throw new BadRequestException(
        'Only elections with status PENDING can be updated',
      );
    }

    if (existing.voterListFinalized) {
      throw new BadRequestException(
        'Cannot update election after voter list has been finalized',
      );
    }

    if (data.isAutomatic) {
      if (!data.startAt || !data.endAt) {
        throw new BadRequestException('Missing startAt or endAt');
      }

      const now = Date.now();

      if (data.startAt < now) {
        throw new BadRequestException('startAt cannot be in the past');
      }

      if (data.startAt >= data.endAt) {
        throw new BadRequestException('startAt must be less than endAt');
      }
    }

    // So sánh candidateIds
    const oldCandidates = existing.candidateIds || [];
    const newCandidates = data.candidateIds || oldCandidates;

    const addedCandidates = newCandidates.filter(
      (id) => !oldCandidates.includes(id),
    );
    const removedCandidates = oldCandidates.filter(
      (id) => !newCandidates.includes(id),
    );

    return prisma.$transaction(async (tx) => {
      // nếu chuyển sang public, xoá voter
      if (data.visibility === 'public') {
        const voters = await this.listVoters(id);
        if (voters.length > 0) {
          const voterIds = voters.map((v) => v.voterId);

          await tx.eventVoter.deleteMany({
            where: {
              voteId: id,
              voterId: { in: voterIds },
              voteType: VotingEventType.ELECTION,
            },
          });

          await tx.auditLog.create({
            data: {
              adminId,
              action: 'REMOVE_ALL_VOTERS',
              targetType: 'ELECTION',
              targetId: id,
              details: { voterIds },
            },
          });
        }
      }

      // lấy tên candidate (chỉ query khi cần)
      let addedCandidateInfos: any[] = [];
      let removedCandidateInfos: any[] = [];

      if (addedCandidates.length > 0) {
        const candidates = await tx.candidate.findMany({
          where: { id: { in: addedCandidates } },
          select: { id: true, name: true },
        });
        addedCandidateInfos = candidates;
      }

      if (removedCandidates.length > 0) {
        const candidates = await tx.candidate.findMany({
          where: { id: { in: removedCandidates } },
          select: { id: true, name: true },
        });
        removedCandidateInfos = candidates;
      }

      // update election
      const updated = await tx.election.update({
        where: { id },
        data,
      });

      // log add candidate
      if (addedCandidateInfos.length > 0) {
        await tx.auditLog.create({
          data: {
            adminId,
            action: 'ADD_CANDIDATE',
            targetType: 'ELECTION',
            targetId: id,
            details: {
              candidates: addedCandidateInfos, // [{id, name}]
            },
          },
        });
      }

      // log remove candidate
      if (removedCandidateInfos.length > 0) {
        await tx.auditLog.create({
          data: {
            adminId,
            action: 'REMOVE_CANDIDATE',
            targetType: 'ELECTION',
            targetId: id,
            details: {
              candidates: removedCandidateInfos, // [{id, name}]
            },
          },
        });
      }

      return updated;
    });
  }

  /**
   * Delete an election by its ID.
   * @param id - The ID of the election to delete.
   * @returns The deleted election object.
   * @throws NotFoundException if the election does not exist.
   */
  async delete(id: string): Promise<Election> {
    const election = await prisma.election.findUnique({
      where: { id },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    if (election.status !== 'pending') {
      throw new BadRequestException(
        'Cannot delete election that is ongoing or ended',
      );
    }

    if (election.votes && Object.keys(election.votes).length > 0) {
      throw new BadRequestException('Cannot delete election with votes');
    }

    await prisma.eventAdmin.deleteMany({
      where: { voteId: id, voteType: 'ELECTION' },
    });

    return prisma.election.delete({
      where: { id },
    });
  }

  /**
   * Start an election by changing its status to 'active'.
   * @param id - The ID of the election to start.
   * @returns The updated election object with status 'active'.
   * @throws NotFoundException if the election does not exist.
   * @throws BadRequestException if the election is automatic or not in 'pending' status.
    */
  async startElection(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
    });

    if (!election) {
      throw new NotFoundException('Không tìm thấy cuộc bầu cử');
    }

    if (election.isAutomatic) {
      throw new BadRequestException('Cuộc bầu cử tự động không thể bắt đầu thủ công');
    }

    if (election.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể bắt đầu khi đang ở trạng thái pending');
    }

    if (!election.voterListFinalized) {
      throw new BadRequestException('Chưa chốt danh sách cử tri');
    }

    if (!election.candidateIds?.length) {
      throw new BadRequestException('Chưa có ứng cử viên');
    }

    return prisma.election.update({
      where: { id },
      data: {
        status: 'active',
        startAt: Date.now(),
      },
    });
  }

  async endElection(id: string) {
    const election = await prisma.election.findUnique({
      where: { id },
    });

    if (!election) {
      throw new NotFoundException('Không tìm thấy cuộc bầu cử');
    }

    // Không cho end nếu là auto
    if (election.isAutomatic) {
      throw new BadRequestException('Cuộc bầu cử tự động không thể kết thúc thủ công');
    }

    // Sai trạng thái
    if (election.status !== 'active') {
      throw new BadRequestException('Chỉ có thể kết thúc khi đang diễn ra');
    }

    return prisma.election.update({
      where: { id },
      data: {
        status: 'completed',
        endAt: Date.now(),
      },
    });
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

    return this.eventVoterService.findAllByEvent(VotingEventType.ELECTION, id);
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
    adminId?: string,
  ): Promise<any> {
    const election = await prisma.election.findUnique({ where: { id } });
    if (!election) throw new NotFoundException('Election not found');

    if (election.visibility === 'public') {
      throw new BadRequestException(
        'Cannot assign voters to a public election',
      );
    }

    const existingVoters = await prisma.voter.findMany({
      where: { id: { in: voterIds } },
      select: { id: true, name: true, email: true },
    });

    if (existingVoters.length === 0) {
      throw new BadRequestException('No valid voters found in system');
    }

    const validVoterIds = existingVoters.map((v) => v.id);
    if (validVoterIds.length === 0) {
      throw new BadRequestException('No valid voters found in system');
    }

    const alreadyAssigned = await prisma.eventVoter.findMany({
      where: {
        voteId: id,
        voterId: { in: validVoterIds },
        voteType: VotingEventType.ELECTION,
      },
      select: { voterId: true },
    });

    const alreadyAssignedIds = alreadyAssigned.map((av) => av.voterId);

    const newVoters = existingVoters.filter(
      (v) => !alreadyAssignedIds.includes(v.id),
    );

    if (newVoters.length === 0) {
      return {
        message: 'All selected voters were already assigned to this election',
        count: 0,
      };
    }

    const dataToInsert = newVoters.map((v) => ({
      voteType: VotingEventType.ELECTION,
      voteId: id,
      voterId: v.id,
      canVote,
    }));

    return prisma.$transaction(async (tx) => {
      await tx.eventVoter.createMany({
        data: dataToInsert,
      });

      // log
      await tx.auditLog.create({
        data: {
          adminId: adminId!,
          action: 'ADD_VOTER',
          targetType: 'ELECTION',
          targetId: id,
          details: {
            voters: newVoters.map((v) => ({
              id: v.id,
              name: v.name,
              email: v.email,
            })),
            canVote,
          },
        },
      });

      return {
        message: 'Voters assigned successfully',
        count: newVoters.length,
      };
    });
  }

  /**
   * Remove a voter from an election.
   * @param id - The ID of the election.
   * @param voterId - The voter document ID to remove.
   * @returns A confirmation message.
   * @throws NotFoundException if the election does not exist.
   */
  async removeVoter(
    id: string,
    voterId: string,
    adminId?: string,
  ): Promise<string> {
    const existing = await prisma.election.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Election not found');

    // lấy info voter trước khi xoá
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      select: { id: true, name: true, email: true },
    });

    return prisma.$transaction(async (tx) => {
      const message = await this.eventVoterService.deleteByVoterId(
        voterId,
        VotingEventType.ELECTION,
        id,
      );

      await tx.auditLog.create({
        data: {
          adminId: adminId!,
          action: 'REMOVE_VOTER',
          targetType: 'ELECTION',
          targetId: id,
          details: {
            voter: voter
              ? {
                id: voter.id,
                name: voter.name,
                email: voter.email,
              }
              : { id: voterId, name: 'Unknown' }, // fallback
          },
        },
      });

      return message;
    });
  }

  /**
   * List all admins assigned to an election.
   * @param electionId - The ID of the election.
   * @return An array of Admin records assigned to the election.
   * @throws NotFoundException if the election does not exist.
   */
  async listAdmins(electionId: string) {
    const existing = await prisma.election.findUnique({
      where: { id: electionId },
    });
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
      (a) =>
        a.role !== AdminRole.ELECTION_ADMIN && a.role !== AdminRole.SUPER_ADMIN,
    );

    if (invalidAdmins.length > 0) {
      const invalidNames = invalidAdmins.map((a) => a.name).join(', ');
      throw new BadRequestException(
        `Cannot assign. The following admins do not have required roles: ${invalidNames}`,
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
      where: { id: electionId },
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

  async getAllSelfNominations(
    admin: Admin,
    status?: SelfNominationStatus,
    search?: string
  ) {
    const filters: any[] = [];

    // filter status
    if (status) {
      filters.push({ status });
    }

    // search
    if (search) {
      filters.push({
        OR: [
          {
            candidate: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            candidate: {
              studentId: { contains: search, mode: 'insensitive' },
            },
          },
          {
            election: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            admin: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    // permission filter
    if (admin.role === AdminRole.ELECTION_ADMIN) {
      const assigned = await prisma.eventAdmin.findMany({
        where: {
          adminId: admin.id,
          voteType: 'ELECTION',
        },
        select: { voteId: true },
      });

      const electionIds = assigned.map((e) => e.voteId);

      // add vào filters
      filters.push({
        electionId: { in: electionIds },
      });
    } else if (admin.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Admin does not have permission to view self nominations'
      );
    }

    const where = filters.length ? { AND: filters } : {};

    return prisma.selfNomination.findMany({
      where,
      include: {
        candidate: true,
        election: true,
        admin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSelfNominations(
    admin: Admin,
    electionId: string,
    status?: SelfNominationStatus
  ) {
    if (admin.role === AdminRole.ELECTION_ADMIN) {
      const canManage = await this.isAdminAssignedToElection(
        admin.id,
        electionId
      );

      if (!canManage) {
        throw new ForbiddenException(
          'ELECTION_ADMIN does not have permission for this election'
        );
      }
    } else if (admin.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Admin does not have permission to view self nominations'
      );
    }

    // query data
    return prisma.selfNomination.findMany({
      where: {
        electionId,
        ...(status && { status }),
      },
      include: {
        candidate: true,
        admin: true,
        election: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMySelfNominations(walletAddress: string, studentId: string) {
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);

    const candidate =
      await this.candidateService.findByWalletAddressAndStudentId(
        normalizedWallet,
        normalizedStudentId,
      );

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    return prisma.selfNomination.findMany({
      where: {
        candidateId: candidate.id,
      },
      include: {
        election: true,
        admin: true,
        candidate: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
  ): Promise<
    SelfNomination & { candidate: Candidate } & { admin: Admin | null } & {
      election: Election;
    }
  > {
    const { walletAddress, studentId, introduction } = data;

    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);

    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new NotFoundException('Election not found');
    }

    if (!election.allowSelfNomination) {
      throw new BadRequestException(
        'Self-nomination is not allowed for this election',
      );
    }

    // Verify candidate profile exists for the given wallet address and student ID
    const candidate =
      await this.candidateService.findByWalletAddressAndStudentId(
        normalizedWallet,
        normalizedStudentId,
      );

    if (!candidate) {
      throw new NotFoundException(
        'Candidate profile not found. Please register your profile first.',
      );
    }

    // Check if candidate is already in the official candidate list
    if (election.candidateIds.includes(candidate.id)) {
      throw new BadRequestException(
        'You are already in the official candidate list for this election',
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
      if (existingNomination.status === 'REQUEST_INFO') {
        throw new BadRequestException(
          'Please update and resubmit your existing nomination',
        );
      }

      if (existingNomination.status === 'PENDING') {
        throw new BadRequestException('Your nomination is under review');
      }

      if (existingNomination.status === 'APPROVED') {
        throw new BadRequestException('You are already approved');
      }

      if (existingNomination.status === 'REJECTED') {
        throw new BadRequestException('Your nomination was rejected');
      }
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
        admin: true,
        election: true,
      },
    });
  }

  async approveSelfNominee(
    electionId: string,
    candidateId: string,
    adminId: string,
  ) {
    const nomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: { electionId, candidateId },
      },
    });

    if (!nomination)
      throw new NotFoundException('Nomination application not found.');
    if (nomination.status !== 'PENDING') {
      throw new BadRequestException(
        'This application has already been processed.',
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const voter = await prisma.voter.findUnique({
      where: {
        walletAddress: candidate.walletAddress,
      },
    });

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, name: true },
    });

    if (!election) throw new NotFoundException('Election not found');

    const result = await prisma.$transaction(async (tx) => {
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: { status: 'APPROVED', adminId },
      });

      await tx.election.update({
        where: { id: electionId },
        data: {
          candidateIds: {
            push: candidateId,
          },
        },
      });

      return tx.auditLog.create({
        data: {
          adminId,
          action: 'APPROVE_SELF_NOMINATION',
          targetType: 'ELECTION',
          targetId: electionId,
          details: {
            election: {
              id: election.id,
              name: election.name,
            },
            candidate: {
              id: candidate.id,
              name: candidate.name,
            },
            nominationId: nomination.id,
            previousStatus: 'PENDING',
            newStatus: 'APPROVED',
          },
        },
      });
    });

    // send mail
    if (voter?.email) {
      const html = buildEmailTemplate(
        'Nomination Approved 🎉',
        `
      <p>Congratulations!</p>
      <p>Your nomination has been <b style="color:green;">approved</b>.</p>
      <p>You are now an official candidate in the election.</p>
      `,
        '#28a745',
      );

      await this.mailService.sendMail(
        voter.email,
        'Nomination Approved 🎉',
        html,
      );
    }

    return result;
  }

  async rejectSelfNominee(
    electionId: string,
    candidateId: string,
    adminId: string,
    adminNotes?: string,
  ) {
    const nomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: { electionId, candidateId },
      },
    });

    if (!nomination)
      throw new NotFoundException('Nomination application not found.');
    if (nomination.status !== 'PENDING') {
      throw new BadRequestException(
        'This application has already been processed.',
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const voter = await prisma.voter.findUnique({
      where: {
        walletAddress: candidate.walletAddress,
      },
    });

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, name: true },
    });

    if (!election) throw new NotFoundException('Election not found');

    const result = prisma.$transaction(async (tx) => {
      // Update status and notes
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: {
          status: 'REJECTED',
          adminId: adminId,
          adminNotes: adminNotes || 'Does not meet requirements',
        },
      });

      // Create Audit Log
      return tx.auditLog.create({
        data: {
          adminId,
          action: 'REJECT_SELF_NOMINATION',
          targetType: 'ELECTION',
          targetId: electionId,
          details: {
            election: {
              id: election.id,
              name: election.name,
            },
            candidate: {
              id: candidate.id,
              name: candidate.name,
            },
            nominationId: nomination.id,
            reason: adminNotes || 'Does not meet requirements',
          },
        },
      });
    });

    if (voter?.email) {
      const html = buildEmailTemplate(
        'Nomination Rejected',
        `
        <p>We regret to inform you that your nomination was <b style="color:red;">rejected</b>.</p>
        <p><b>Reason:</b> ${adminNotes || 'Does not meet requirements'}</p>
        `,
        '#dc3545',
      );

      await this.mailService.sendMail(voter.email, 'Nomination Rejected', html);
    }

    return result;
  }

  async requestInfoSelfNominee(
    electionId: string,
    candidateId: string,
    adminId: string,
    adminNotes?: string,
  ) {
    const nomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: { electionId, candidateId },
      },
    });

    if (!nomination)
      throw new NotFoundException('Nomination application not found.');

    if (nomination.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending applications can request more info.',
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const voter = await prisma.voter.findUnique({
      where: {
        walletAddress: candidate.walletAddress,
      },
    });

    const election = await prisma.election.findUnique({
      where: { id: electionId },
      select: { id: true, name: true },
    });

    if (!election) throw new NotFoundException('Election not found');

    const result = prisma.$transaction(async (tx) => {
      // Update status -> REQUEST_INFO
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: {
          status: 'REQUEST_INFO',
          adminId: adminId,
          adminNotes: adminNotes || 'Please provide additional information',
        },
      });

      // 2. Create Audit Log
      return tx.auditLog.create({
        data: {
          adminId,
          action: 'REQUEST_INFO_SELF_NOMINATION',
          targetType: 'ELECTION',
          targetId: electionId,
          details: {
            election: {
              id: election.id,
              name: election.name,
            },
            candidate: {
              id: candidate.id,
              name: candidate.name,
            },
            nominationId: nomination.id,
            reason: adminNotes || 'Please provide additional information',
            previousStatus: 'PENDING',
            newStatus: 'REQUEST_INFO',
          },
        },
      });
    });

    if (voter?.email) {
      const html = buildEmailTemplate(
        'Additional Information Required',
        `
        <p>Your nomination requires additional information.</p>
        <p><b>Admin message:</b></p>
        <div style="background:#fff3cd;padding:10px;border-radius:5px;">
          ${adminNotes || 'Please provide more details'}
        </div>
        <p>Please update and resubmit your application.</p>
        `,
        '#ffc107',
      );

      await this.mailService.sendMail(
        voter.email,
        'More Information Required',
        html,
      );
    }

    return result;
  }

  async resubmitSelfNomination(
    electionId: string,
    data: any,
    file?: Express.Multer.File,
  ): Promise<
    SelfNomination & {
      candidate: Candidate;
      admin: Admin | null;
      election: Election;
    }
  > {
    const { walletAddress, studentId, introduction, name, bio } = data;

    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);

    // ===== Find candidate =====
    const candidate =
      await this.candidateService.findByWalletAddressAndStudentId(
        normalizedWallet,
        normalizedStudentId,
      );

    if (!candidate) {
      throw new NotFoundException('Candidate profile not found');
    }

    // ===== Find nomination =====
    const nomination = await prisma.selfNomination.findUnique({
      where: {
        electionId_candidateId: {
          electionId,
          candidateId: candidate.id,
        },
      },
    });

    if (!nomination) {
      throw new NotFoundException('Nomination not found');
    }

    if (nomination.status !== 'REQUEST_INFO') {
      throw new BadRequestException(
        'Only nominations requiring additional information can be resubmitted',
      );
    }

    // ===== Upload avatar nếu có =====
    let avatarUrl = candidate.avatarUrl;

    if (file) {
      avatarUrl = `/uploads/${file.filename}`;
    }

    // ===== Update candidate =====
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        name: name ?? candidate.name,
        bio: bio ?? candidate.bio,
        avatarUrl: avatarUrl,
      },
    });

    // ===== 5. Update nomination =====
    return prisma.selfNomination.update({
      where: { id: nomination.id },
      data: {
        introduction: introduction ?? nomination.introduction,
        status: 'PENDING',
        adminNotes: null,
        adminId: null,
      },
      include: {
        candidate: true,
        admin: true,
        election: true,
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

    return prisma.election.findMany({
      where: {
        OR: [
          { id: { in: electionIds } }, // voter eligible
          { visibility: 'public' },    // tất cả public
        ],
      },
    });
  }
}

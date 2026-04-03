import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Admin, AdminRole, Candidate, Election, EventVoter, SelfNomination, SelfNominationStatus } from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { EventVoterService } from '../voter';
import { VotingContextService } from '../../../voting';
import { CreateElectionRequestDto, ResubmitSelfNominateDto, SelfNominateDto, UpdateElectionRequestDto } from './dto';
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

  async getPublicElections(walletAddress: string, studentId: string): Promise<Election[]> {
    const normalizedWallet = this.votingContextService.normalizeWalletAddress(walletAddress);
    const normalizedStudentId = this.votingContextService.normalizeStudentId(studentId);

    const candidate = await this.candidateService.findByWalletAddressAndStudentId(
      normalizedWallet,
      normalizedStudentId
    );

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    
    return prisma.election.findMany({
      where: { visibility: 'public' },
      orderBy: { createdAt: 'desc' },
    });
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

    if (existing.status !== 'pending') {
      throw new BadRequestException('Only elections with status PENDING can be updated');
    }

    if (existing.voterListFinalized) {
      throw new BadRequestException('Cannot update election after voter list has been finalized');
    }

    if (data.visibility === 'public') {
      const voters = await this.listVoters(id);
      if (voters.length > 0) {
        const voterIds = voters.map(v => v.voterId);
        await prisma.eventVoter.deleteMany({
          where: {
            voteId: id,
            voterId: { in: voterIds },
            voteType: VotingEventType.ELECTION,
          },
        });
      }
    }

    return prisma.election.update({ where: { id }, data });
  }

  /**
   * Delete an election by its ID.
   * @param id - The ID of the election to delete.
   * @returns The deleted election object.
   * @throws NotFoundException if the election does not exist.
   */
  async delete(id: string): Promise<Election> {
    const election = await prisma.election.findUnique({
      where: { id }
    });

    if (!election) {
      throw new NotFoundException("Election not found");
    }

    if (election.status !== "pending") {
      throw new BadRequestException(
        "Cannot delete election that is ongoing or ended"
      );
    }

    if (election.votes && Object.keys(election.votes).length > 0) {
      throw new BadRequestException(
        "Cannot delete election with votes"
      );
    }

    await prisma.eventAdmin.deleteMany({
      where: { voteId: id, voteType: 'ELECTION' }
    });

    return prisma.election.delete({
      where: { id }
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

    if (election.visibility === 'public') {
      throw new BadRequestException(
        'Cannot assign voters to a public election',
      );
    }

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

  async getAllSelfNominations(status?: SelfNominationStatus) {
    return prisma.selfNomination.findMany({
      where: {
        ...(status && { status }),
      },
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
    electionId: string,
    status?: SelfNominationStatus
  ) {
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
    const normalizedWallet = this.votingContextService.normalizeWalletAddress(walletAddress);
    const normalizedStudentId = this.votingContextService.normalizeStudentId(studentId);

    const candidate = await this.candidateService.findByWalletAddressAndStudentId(
      normalizedWallet,
      normalizedStudentId
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
  ): Promise<SelfNomination & { candidate: Candidate } & { admin: Admin | null } & { election: Election }> {
    const { walletAddress, studentId, introduction } = data;

    const normalizedWallet = this.votingContextService.normalizeWalletAddress(
      walletAddress,
    );

    const normalizedStudentId = this.votingContextService.normalizeStudentId(
      studentId,
    );

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
      normalizedWallet,
      normalizedStudentId,
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
      if (existingNomination.status === 'REQUEST_INFO') {
        throw new BadRequestException(
          'Please update and resubmit your existing nomination'
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
        election: true
      },
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

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const voter = await prisma.voter.findUnique({
      where: {
        walletAddress: candidate.walletAddress
      }
    });

    const result = await prisma.$transaction(async (tx) => {
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: { status: 'APPROVED', adminId }
      });

      await tx.election.update({
        where: { id: electionId },
        data: {
          candidateIds: {
            push: candidateId
          }
        }
      });

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

    // send mail 
    if (voter?.email) {
      const html = buildEmailTemplate(
        'Nomination Approved 🎉',
        `
      <p>Congratulations!</p>
      <p>Your nomination has been <b style="color:green;">approved</b>.</p>
      <p>You are now an official candidate in the election.</p>
      `,
        '#28a745'
      );

      await this.mailService.sendMail(
        voter.email,
        'Nomination Approved 🎉',
        html
      );
    }

    return result;
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

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const voter = await prisma.voter.findUnique({
      where: {
        walletAddress: candidate.walletAddress
      }
    });

    const result = prisma.$transaction(async (tx) => {
      // Update status and notes
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: {
          status: 'REJECTED',
          adminId: adminId,
          adminNotes: adminNotes || 'Does not meet requirements'
        }
      });

      // Create Audit Log
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

    if (voter?.email) {

      const html = buildEmailTemplate(
        'Nomination Rejected',
        `
        <p>We regret to inform you that your nomination was <b style="color:red;">rejected</b>.</p>
        <p><b>Reason:</b> ${adminNotes || 'Does not meet requirements'}</p>
        `,
        '#dc3545'
      );

      await this.mailService.sendMail(
        voter.email,
        'Nomination Rejected',
        html
      );
    }

    return result;
  }

  async requestInfoSelfNominee(
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

    if (!nomination)
      throw new NotFoundException('Nomination application not found.');

    if (nomination.status !== 'PENDING') {
      throw new BadRequestException(
        'Only pending applications can request more info.'
      );
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId }
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const voter = await prisma.voter.findUnique({
      where: {
        walletAddress: candidate.walletAddress
      }
    });

    const result = prisma.$transaction(async (tx) => {
      // Update status -> REQUEST_INFO
      await tx.selfNomination.update({
        where: { id: nomination.id },
        data: {
          status: 'REQUEST_INFO',
          adminId: adminId,
          adminNotes: adminNotes || 'Please provide additional information'
        }
      });

      // 2. Create Audit Log
      return tx.auditLog.create({
        data: {
          adminId,
          action: 'REQUEST_INFO_SELF_NOMINATION',
          targetType: 'ELECTION',
          targetId: electionId,
          details: {
            candidateId,
            nominationId: nomination.id,
            reason: adminNotes || 'Please provide additional information',
            previousStatus: 'PENDING',
            newStatus: 'REQUEST_INFO'
          }
        }
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
        '#ffc107'
      );

      await this.mailService.sendMail(
        voter.email,
        'More Information Required',
        html
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
    if (electionIds.length === 0) return [];

    return prisma.election.findMany({
      where: { id: { in: electionIds } },
    });
  }
}

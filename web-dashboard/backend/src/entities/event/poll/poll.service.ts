import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Admin, AdminRole, EventVoter, Poll } from '@prisma/client';
import { VotingEventType } from '../../../enums';
import { EventVoterService } from '../voter';
import { VotingContextService } from '../../../voting';
import { CreatePollRequestDto, UpdatePollRequestDto } from './dto';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class PollService {
  constructor(
    private readonly eventVoterService: EventVoterService,
    private readonly votingContextService: VotingContextService,
  ) {}

  /**
   * Get all polls, optionally filtered by visibility.
   * @param query - Optional query object to filter polls by visibility.
   * @returns Array of polls matching the query.
   * @throws BadRequestException if an invalid visibility filter is provided.
   * Valid visibility values are "public" or "private". If no filter is provided, all polls are returned.
   */
  async getAll(
    admin: Admin,
    query?: { visibility?: string; search?: string },
  ): Promise<Poll[]> {
    const where: any = {};

    if (query?.visibility) {
      if (query.visibility === 'public') {
        where.visibility = 'public';
      } else if (query.visibility === 'private') {
        where.visibility = 'private';
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

    // Nếu là POLL_ADMIN, chỉ lấy các election được gán
    if (admin.role === AdminRole.POLL_ADMIN) {
      const assigned = await prisma.eventAdmin.findMany({
        where: {
          adminId: admin.id,
          voteType: 'POLL',
        },
        select: { voteId: true },
      });

      const pollIds = assigned.map((e) => e.voteId);
      where.id = { in: pollIds };
    } else if (admin.role === AdminRole.SUPER_ADMIN) {
      // SUPER_ADMIN xem tất cả -> không cần filter thêm
    } else {
      throw new BadRequestException(
        'Admin does not have permission to view elections',
      );
    }

    return prisma.poll.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a poll by MongoDB document id.
   * @param id - Poll document id.
   * @returns The poll document or null if not found.
   */
  async getById(id: string): Promise<Poll | null> {
    return prisma.poll.findUnique({ where: { id } });
  }

  /**
   * Check if an admin is assigned to a specific poll.
   * @param adminId - The ID of the admin.
   * @param pollId - The ID of the poll.
   * @returns A boolean indicating whether the admin is assigned to the poll.
   */
  async isAdminAssignedToPoll(
    adminId: string,
    pollId: string,
  ): Promise<boolean> {
    const assignment = await prisma.eventAdmin.findUnique({
      where: {
        adminId_voteType_voteId: {
          adminId,
          voteType: 'POLL',
          voteId: pollId,
        },
      },
    });
    return !!assignment;
  }

  // List admins
  async listAdmins(pollId: string) {
    const poll = await prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');

    return await prisma.eventAdmin.findMany({
      where: { voteType: 'POLL', voteId: pollId },
      include: { admin: true },
    });
  }

  // Assign
  async assignAdmins(pollId: string, adminIds: string[]): Promise<any> {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });
    if (!poll) throw new NotFoundException('Poll not found');

    const admins = await prisma.admin.findMany({
      where: { id: { in: adminIds } },
    });

    if (admins.length !== adminIds.length) {
      throw new BadRequestException('One or more Admin IDs are invalid');
    }

    // Chấp nhận nếu là POLL_ADMIN HOẶC SUPER_ADMIN
    const invalidAdmins = admins.filter(
      (a) =>
        a.role !== AdminRole.POLL_ADMIN && a.role !== AdminRole.SUPER_ADMIN,
    );

    if (invalidAdmins.length > 0) {
      const invalidNames = invalidAdmins.map((a) => a.name).join(', ');
      throw new BadRequestException(
        `Cannot assign. The following admins do not have required roles: ${invalidNames}`,
      );
    }

    const existingAssignments = await prisma.eventAdmin.findMany({
      where: {
        voteType: 'POLL',
        voteId: pollId,
        adminId: { in: adminIds },
      },
      select: { adminId: true },
    });

    const alreadyAssigned = existingAssignments.map((a) => a.adminId);
    const newAdminIds = adminIds.filter((id) => !alreadyAssigned.includes(id));

    if (newAdminIds.length > 0) {
      await prisma.eventAdmin.createMany({
        data: newAdminIds.map((adminId) => ({
          adminId,
          voteType: 'POLL',
          voteId: pollId,
        })),
      });
    }

    return prisma.poll.findUniqueOrThrow({
      where: { id: pollId },
    });
  }

  // Remove
  async removeAdmin(pollId: string, adminId: string) {
    try {
      await prisma.eventAdmin.delete({
        where: {
          adminId_voteType_voteId: {
            adminId,
            voteType: 'POLL',
            voteId: pollId,
          },
        },
      });
      return 'Removed successfully';
    } catch {
      throw new BadRequestException('Assignment not found');
    }
  }

  /**
   * Create a poll document.
   * @param data - Poll payload.
   * @returns The created poll document.
   */
  async create(data: CreatePollRequestDto): Promise<Poll> {
    return prisma.poll.create({
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
    const existing = await prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    if (existing.status !== 'pending') {
      throw new BadRequestException(
        'Only poll with status PENDING can be updated',
      );
    }

    if (existing.voterListFinalized) {
      throw new BadRequestException(
        'Cannot update poll after voter list has been finalized',
      );
    }

    if (data.visibility === 'public') {
      const voters = await this.listVoters(id);
      if (voters.length > 0) {
        const voterIds = voters.map((v) => v.voterId);
        await prisma.eventVoter.deleteMany({
          where: {
            voteId: id,
            voterId: { in: voterIds },
            voteType: VotingEventType.POLL,
          },
        });
      }
    }

    return prisma.poll.update({ where: { id }, data });
  }

  /**
   * Delete a poll document.
   * @param id - Poll document id.
   * @returns The deleted poll document.
   * @throws NotFoundException if the poll does not exist.
   */
  async delete(id: string): Promise<Poll> {
    const poll = await prisma.poll.findUnique({
      where: { id },
    });

    if (!poll) {
      throw new NotFoundException('Poll not found');
    }

    if (poll.status !== 'pending') {
      throw new BadRequestException(
        'Cannot delete poll that is ongoing or ended',
      );
    }

    if (poll.votes && Object.keys(poll.votes).length > 0) {
      throw new BadRequestException('Cannot delete poll with votes');
    }

    await prisma.eventAdmin.deleteMany({
      where: { voteId: id, voteType: 'POLL' },
    });

    return prisma.poll.delete({
      where: { id },
    });
  }

  /**
   * List all voters assigned to a poll.
   * @param id - The ID of the poll.
   * @returns An array of EventVoter records.
   * @throws NotFoundException if the poll does not exist.
   */
  async listVoters(id: string): Promise<EventVoter[]> {
    const existing = await prisma.poll.findUnique({ where: { id } });
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
    voterIds: string[],
    canVote = true,
    adminId?: string,
  ): Promise<any> {
    const existing = await prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    if (existing.visibility === 'public') {
      throw new BadRequestException('Cannot assign voters to a public poll');
    }

    const existingVoters = await prisma.voter.findMany({
      where: { id: { in: voterIds } },
      select: { id: true, name: true, email: true },
    });

    const validVoterIds = existingVoters.map((v) => v.id);
    if (validVoterIds.length === 0) {
      throw new BadRequestException('No valid voters found in system');
    }

    const alreadyAssigned = await prisma.eventVoter.findMany({
      where: {
        voteId: id,
        voterId: { in: validVoterIds },
        voteType: VotingEventType.POLL,
      },
      select: { voterId: true },
    });

    const alreadyAssignedIds = alreadyAssigned.map((av) => av.voterId);

    const newVoters = existingVoters.filter(
      (v) => !alreadyAssignedIds.includes(v.id),
    );

    if (newVoters.length === 0) {
      return {
        message: 'All selected voters are already assigned to this poll',
        count: 0,
      };
    }

    const dataToInsert = newVoters.map((v) => ({
      voteType: VotingEventType.POLL,
      voteId: id,
      voterId: v.id,
      canVote,
    }));

    // transaction + audit log
    return prisma.$transaction(async (tx) => {
      await tx.eventVoter.createMany({
        data: dataToInsert,
      });

      await tx.auditLog.create({
        data: {
          adminId: adminId!,
          action: 'ADD_VOTER',
          targetType: 'POLL',
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
   * Remove a voter from a poll.
   * @param id - The ID of the poll.
   * @param voterId - The voter document ID to remove.
   * @returns A confirmation message.
   * @throws NotFoundException if the poll does not exist.
   */
  async removeVoter(
    id: string,
    voterId: string,
    adminId?: string,
  ): Promise<string> {
    const existing = await prisma.poll.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Poll not found');

    // lấy info voter trước khi xoá
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      select: { id: true, name: true, email: true },
    });

    return prisma.$transaction(async (tx) => {
      const message = await this.eventVoterService.deleteByVoterId(
        voterId,
        VotingEventType.POLL,
        id,
      );

      await tx.auditLog.create({
        data: {
          adminId: adminId!,
          action: 'REMOVE_VOTER',
          targetType: 'POLL',
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

    const voter = await prisma.voter.findFirst({
      where: {
        walletAddress: normalizedWallet,
        studentId: normalizedStudentId,
      },
    });
    if (!voter) throw new NotFoundException('Voter not found');

    const eventVoters = await prisma.eventVoter.findMany({
      where: { voterId: voter.id, voteType: VotingEventType.POLL },
    });

    const pollIds = eventVoters.map((ev: EventVoter) => ev.voteId);
    if (pollIds.length === 0) return [];

    return prisma.poll.findMany({
      where: { id: { in: pollIds } },
    });
  }
}

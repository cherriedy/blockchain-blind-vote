import { BadRequestException, Injectable } from '@nestjs/common';
import { BallotRequest } from '@prisma/client';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class BallotRequestService {
  /**
   * Finds a single ballot request record based on the unique combination of studentId, walletAddress, voteType, and voteId.
   * @param studentId - The identifier of the student associated with the ballot request.
   * @param walletAddress - The wallet address associated with the ballot request.
   * @param voteType - The type of the voting event (election or poll).
   * @param voteId - The identifier of the voting event (election or poll).
   * @returns The found BallotRequest record or null if no matching record is found.
   */
  async findOne(
    studentId: string,
    walletAddress: string,
    voteType: string,
    voteId: string,
  ): Promise<BallotRequest | null> {
    return prisma.ballotRequest.findUnique({
      where: {
        studentId_walletAddress_voteType_voteId: {
          studentId,
          walletAddress,
          voteType,
          voteId,
        },
      },
    });
  }

  /**
   * Upserts a ballot request record based on the unique combination of voteType, voteId, and walletAddress.
   * If a record with the same combination exists, it will be updated with the provided fields in the entity.
   * If no such record exists, a new one will be created with all the provided fields in the entity.
   * @param entity - A partial BallotRequest object containing the fields to be upserted.
   * @returns The upserted BallotRequest record.
   * @throws BadRequestException if the required fields (studentId, walletAddress, voteType, voteId) are not provided in the entity.
   */
  async upsert(entity: Partial<BallotRequest>) {
    if (
      !entity.studentId ||
      !entity.walletAddress ||
      !entity.voteType ||
      !entity.voteId
    ) {
      throw new BadRequestException(
        'studentId, walletAddress, voteType and voteId are required for upserting ballot request',
      );
    }

    const { studentId, walletAddress, voteType, voteId, ...rest } = entity;
    return prisma.ballotRequest.upsert({
      where: {
        studentId_walletAddress_voteType_voteId: {
          studentId,
          walletAddress,
          voteType,
          voteId,
        },
      },
      update: { ...rest },
      create: {
        studentId,
        walletAddress,
        voteType,
        voteId,
        ...rest,
      },
    });
  }
}

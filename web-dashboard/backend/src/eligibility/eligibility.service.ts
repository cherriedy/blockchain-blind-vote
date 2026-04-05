import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { VotingContextService } from '../voting/context';
import { VotingEventType, VotingEventVisibility } from '../enums';
import { BallotRequestService } from '../voting/ballot-request/ballot-request.service';
import {
  toEligibilityChallengeResponseDto,
  toEligibilityAlreadyVerifiedResponseDto,
  CreateEligibilityChallengeResponseDto,
} from './dto';
import { prisma } from 'prisma/prisma.service';

@Injectable()
export class EligibilityService {
  constructor(
    private readonly ballotRequestService: BallotRequestService,
    private readonly votingContextService: VotingContextService,
  ) {}

  /**
   *
   * @param studentId - The identifier of the student requesting the challenge
   * @param walletAddress - The wallet address to be verified for eligibility
   * @param voteType - The type of the voting event (election or poll)
   * @param voteId - The identifier of the voting event
   *
   * @returns An object containing the challenge nonce, expiration time, and message to be signed
   * @throws UnauthorizedException if the voter is not assigned to a private event or if the registration is not approved
   */
  async createEligibilityChallenge(
    studentId: string,
    walletAddress: string,
    voteType?: string,
    voteId?: string,
  ): Promise<CreateEligibilityChallengeResponseDto> {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    const voter = await prisma.voter.findFirst({
      where: {
        studentId: normalizedStudentId,
        walletAddress: normalizedWallet,
        isActive: true,
      },
    });

    if (!voter) {
      throw new BadRequestException('Voter not found or inactive');
    }

    // If a vote scope is provided, ensure the voter is assigned for private events.
    // When called from the web login flow, voteType and voteId will be undefined,
    // and we skip the per-vote assignment check.
    const scopeVoteType = voteType ?? 'LOGIN';
    const scopeVoteId = voteId ?? 'LOGIN';

    if (voteType && voteId) {
      await this.assertVoterAssignedToPrivateEvent(
        normalizedStudentId,
        normalizedWallet,
        voteType as VotingEventType,
        voteId,
      );
    }

    const existingRequest = await this.ballotRequestService.findOne(
      normalizedStudentId,
      normalizedWallet,
      scopeVoteType,
      scopeVoteId,
    );
    if (existingRequest && existingRequest.isChallenged) {
      return toEligibilityAlreadyVerifiedResponseDto(
        'You have already completed the eligibility challenge for this voting event.',
      );
    }

    // Use upsert to create or update ballot request and set the challenge
    const ballotRequest = await this.ballotRequestService.upsert({
      studentId: normalizedStudentId,
      walletAddress: normalizedWallet,
      voteType: scopeVoteType,
      voteId: scopeVoteId,
      walletChallengeNonce: randomBytes(16).toString('hex'),
      walletChallengeExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Build a human-friendly message. For login-scoped challenges we use a
    // different message format to avoid coupling to a specific vote.
    const message =
      voteType && voteId
        ? `Voting eligibility challenge:${voteType}:${voteId}:${ballotRequest.walletChallengeNonce}`
        : `Login wallet challenge:${ballotRequest.walletChallengeNonce}`;

    return toEligibilityChallengeResponseDto(
      ballotRequest.walletChallengeNonce!,
      ballotRequest.walletChallengeExpiresAt!,
      message,
    );
  }

  /**
   *
   * @param studentId - The identifier of the student
   * @param walletAddress - The wallet address of the student
   * @param signature - The signature provided by the voter to verify their eligibility
   * @param voteType - The type of the voting event
   * @param voteId - The identifier of the voting event
   */
  async verifyEligibilitySignature(
    studentId: string,
    walletAddress: string,
    signature: string,
    voteType?: string,
    voteId?: string,
  ) {
    // If voteType/voteId provided, validate scope; otherwise this is a login-scoped verification.
    if (voteType && voteId) {
      this.votingContextService.assertVoteScope(voteType, voteId);
    }

    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    // Only assert assignment for vote-scoped verifications. Login flow should not require assignment.
    if (voteType && voteId) {
      await this.assertVoterAssignedToPrivateEvent(
        normalizedStudentId,
        normalizedWallet,
        voteType as VotingEventType,
        voteId,
      );
    }

    // Replace findFirst with upsert to get or create the ballot request
    const scopeVoteType = voteType ?? 'LOGIN';
    const scopeVoteId = voteId ?? 'LOGIN';

    const ballotRequest = await this.ballotRequestService.findOne(
      normalizedStudentId,
      normalizedWallet,
      scopeVoteType,
      scopeVoteId,
    );

    if (
      !ballotRequest ||
      !ballotRequest.walletChallengeNonce ||
      !ballotRequest.walletChallengeExpiresAt
    ) {
      throw new UnauthorizedException('Challenge was not requested');
    }
    if (ballotRequest.walletChallengeExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Challenge expired');
    }

    const challengeMessage =
      voteType && voteId
        ? `Voting eligibility challenge:${voteType}:${voteId}:${ballotRequest.walletChallengeNonce}`
        : `Login wallet challenge:${ballotRequest.walletChallengeNonce}`;
    const recovered = ethers
      .verifyMessage(challengeMessage, signature)
      .toLowerCase();

    if (recovered !== normalizedWallet) {
      throw new UnauthorizedException('Wallet signature is invalid');
    }

    await prisma.ballotRequest.update({
      where: { id: ballotRequest.id },
      data: {
        isChallenged: true,
        walletChallengeNonce: null,
        walletChallengeExpiresAt: null,
      },
    });

    return { verified: true };
  }

  /**
   * Logout handler: removes any login-scoped ballot request so that the next login
   * will require a fresh eligibility challenge.
   *
   * @param studentId - student identifier
   * @param walletAddress - wallet address
   * @returns an object with deleted count
   */
  async logout(studentId: string, walletAddress: string) {
    const normalizedStudentId =
      this.votingContextService.normalizeStudentId(studentId);
    const normalizedWallet =
      this.votingContextService.normalizeWalletAddress(walletAddress);

    // Remove LOGIN-scoped ballot requests (use service method to avoid exceptions)
    const deleted = await this.ballotRequestService.delete(
      normalizedStudentId,
      normalizedWallet,
      'LOGIN',
      'LOGIN',
    );

    return { deleted };
  }

  /**
   * Resolves the visibility of a voting event based on its type and identifier.
   *
   * @param voteType - The type of the voting event
   * @param voteId - The identifier of the voting event
   * @return The visibility of the voting event, PRIVATE if not found
   * @throws NotFoundException if the voting event is not found
   */
  private async resolveEventVisibility(
    voteType: VotingEventType,
    voteId: string,
  ): Promise<VotingEventVisibility> {
    if (voteType === VotingEventType.ELECTION) {
      const ev = await prisma.election.findUnique({
        where: { id: voteId },
        select: { visibility: true },
      });
      return (
        (ev?.visibility as VotingEventVisibility) ||
        VotingEventVisibility.PRIVATE
      );
    } else if (voteType === VotingEventType.POLL) {
      const ev = await prisma.poll.findUnique({
        where: { id: voteId },
        select: { visibility: true },
      });
      return (
        (ev?.visibility as VotingEventVisibility) ||
        VotingEventVisibility.PRIVATE
      );
    }
    return VotingEventVisibility.PRIVATE;
  }

  /**
   * Checks if the voter is assigned to a private voting event.
   * - If the event is public, it allows all voters.
   * - If private events, it verifies that is assigned to the event.
   *
   * @param studentId - The identifier of the student
   * @param walletAddress - The wallet address of the student
   * @param voteType - The type of the voting event (election or poll)
   * @param voteId - The identifier of the voting event
   * @throws UnauthorizedException if the voter is not assigned to the private event or if their profile is inactive
   */
  private async assertVoterAssignedToPrivateEvent(
    studentId: string,
    walletAddress: string,
    voteType: VotingEventType,
    voteId: string,
  ) {
    const visibility = await this.resolveEventVisibility(voteType, voteId);
    // If the event is public, we don't need to check for voter assignment
    if (visibility === VotingEventVisibility.PUBLIC) return;

    const voter = await prisma.voter.findFirst({
      where: { studentId, walletAddress, isActive: true },
    });
    if (!voter) {
      throw new UnauthorizedException(
        'Voter profile not found or inactive for this private event',
      );
    }

    const assigned = await prisma.eventVoter.findFirst({
      where: { voterId: voter.id, voteType, voteId, canVote: true },
    });
    if (!assigned) {
      throw new UnauthorizedException(
        'You are not assigned to this private voting event',
      );
    }
  }
}

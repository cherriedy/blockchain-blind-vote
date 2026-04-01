import {
  ForbiddenException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Type,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { Voter } from '@prisma/client';
import { EventVoterService, VoterService } from '../../entities';
import { VotingEventType } from '../../enums';

/**
 * Factory to create a VisibilityGuard for a specific event type (election, poll, ...).
 *
 * Resolves voter identity from either `x-student-id` or `x-wallet-address` headers,
 * verifies the voter is active, and confirms eligibility for the given event.
 *
 * @param {VotingEventType} eventType - The type of voting event to guard.
 * @returns A CanActivate guard class for the given event type.
 *
 * @example
 *   @UseGuards(VisibilityGuard('election'))
 *   @Get(':id')
 *   getElection(...) { ... }
 */
function VisibilityGuard(eventType: VotingEventType): Type<CanActivate> {
  @Injectable()
  class VisibilityGuardHost implements CanActivate {
    constructor(
      private readonly voterService: VoterService,
      private readonly eventVoterService: EventVoterService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();

      const voteId = this.resolveVoteId(request);
      if (!voteId) {
        throw new BadRequestException('Missing or invalid voteId parameter');
      }

      const { studentId, walletAddress } = this.resolveIdentityHeaders(request);
      if (!studentId && !walletAddress) {
        throw new UnauthorizedException(
          'Either x-student-id or x-wallet-address header is required',
        );
      }

      const voter = await this.resolveVoter(studentId, walletAddress);
      this.assertVoterEligible(voter);

      const assignment = await this.eventVoterService.findEligibleEventVoter(
        eventType,
        voteId,
        voter.id,
      );
      if (!assignment) {
        throw new ForbiddenException('Voter is not eligible for this event');
      }

      return true;
    }

    /**
     * Extracts and normalizes the voter identity headers from the request.
     * Multi-value headers are collapsed to their first value.
     */
    private resolveIdentityHeaders(request: Request): {
      studentId: string | undefined;
      walletAddress: string | undefined;
    } {
      const normalize = (
        header: string | string[] | undefined,
      ): string | undefined => (Array.isArray(header) ? header[0] : header);

      return {
        studentId: normalize(request.headers['x-student-id']),
        walletAddress: normalize(request.headers['x-wallet-address']),
      };
    }

    /**
     * Resolves a voter from the data store, preferring studentId over walletAddress.
     * Throws UnauthorizedException if no voter is found.
     */
    private async resolveVoter(
      studentId: string | undefined,
      walletAddress: string | undefined,
    ): Promise<Voter> {
      const voter: Voter | null = studentId
        ? await this.voterService.findByStudentId(studentId)
        : await this.voterService.findByWalletAddress(walletAddress!);

      if (!voter) {
        throw new UnauthorizedException('Voter not found');
      }
      return voter;
    }

    /**
     * Asserts that a voter exists and is active.
     * Throws ForbiddenException for inactive voters.
     */
    private assertVoterEligible(voter: Voter): void {
      if (!voter.isActive) {
        throw new ForbiddenException('Voter account is inactive');
      }
    }

    /**
     * Resolves the voteId from route parameters, supporting both `voteId` and `id`
     * as possible parameter names.
     */
    private resolveVoteId(request: Request): string | null {
      const param = request.params.voteId ?? request.params.id;
      return typeof param === 'string' && param.trim() !== ''
        ? param.trim()
        : null;
    }
  }

  return VisibilityGuardHost;
}

// Create a VisibilityGuard specifically for election-related endpoints
export const ElectionVisibilityGuard = VisibilityGuard(
  VotingEventType.ELECTION,
);

// Create a VisibilityGuard specifically for poll-related endpoints
export const PollVisibilityGuard = VisibilityGuard(VotingEventType.POLL);

import { BadRequestException, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class VotingContextService {
  readonly provider = new ethers.JsonRpcProvider(
    'https://rpc-amoy.polygon.technology',
  );

  readonly contractAddress =
    process.env.CONTRACT_ADDRESS ||
    '0x0000000000000000000000000000000000000000';

  readonly contractABI = [
    'function isVotingActive() view returns (bool)',
    'function currentElectionId() view returns (uint256)',
  ];

  readonly votingContract = new ethers.Contract(
    this.contractAddress,
    this.contractABI,
    this.provider,
  );

  readonly adminWallet = process.env.ADMIN_PRIVATE_KEY
    ? new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY)
    : null;

  readonly nullifierSecret =
    process.env.NULLIFIER_SECRET || 'default_local_secret';

  normalizeStudentId(studentId: string) {
    return (studentId || '').trim().toUpperCase();
  }

  normalizeWalletAddress(walletAddress: string) {
    return (walletAddress || '').trim().toLowerCase();
  }

  /**
   * Assert that the voteType and voteId are provided for the voting scope.
   *
   * @param voteType - The type of the vote.
   * @param voteId - The identifier of the vote.
   * @throws {BadRequestException} If either voteType or voteId is missing.
   */
  assertVoteScope(voteType: string, voteId: string) {
    if (!voteType || !voteId) {
      throw new BadRequestException('voteType and voteId are required');
    }
  }
}

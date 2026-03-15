import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { VotingEventType } from '../../enums';
import { BLIND_BALLOT_BOX_ABI } from './abi';
import { CastVoteDto } from './blockchain.dto';
import { VoteUpdatePayload } from './interfaces';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);

  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  // Reverse maps: bytes32 → original mongoId (populated on every castVote call)
  private readonly eventReverseMap = new Map<
    string,
    { voteType: string; voteId: string }
  >();
  private readonly candidateReverseMap = new Map<string, string>();

  onModuleInit() {
    const rpcUrl = process.env.RPC_URL ?? 'https://rpc-amoy.polygon.technology';
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;

    if (!contractAddress) {
      this.logger.warn(
        'CONTRACT_ADDRESS not set, cannot connect to blockchain contract',
      );
      return;
    }
    if (!adminPrivateKey) {
      this.logger.warn(
        'ADMIN_PRIVATE_KEY not set, cannot send transactions to blockchain',
      );
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(adminPrivateKey, this.provider);
    this.contract = new ethers.Contract(
      contractAddress,
      BLIND_BALLOT_BOX_ABI,
      this.signer,
    );

    this.logger.log(`Connected to contract at ${contractAddress}`);
  }

  // ─── Cast Vote ─────────────────────────────────────────────────────────────

  /**
   * Cast a vote for an election or poll. Validates the input and calls the appropriate contract function.
   * @param dto - The data transfer object containing vote details
   * @returns The transaction hash of the vote transaction
   * @throws BadRequestException if the input is invalid or if the service is not properly configured
   */
  async castVote(dto: CastVoteDto): Promise<string> {
    this.assertReady();

    // Track reverse maps so contract events can be decoded back to mongoIds
    const eventIdBytes32 = this.mongoIdToBytes32(dto.voteId);
    this.eventReverseMap.set(eventIdBytes32, {
      voteType: dto.voteType,
      voteId: dto.voteId,
    });
    if (dto.candidateId) {
      this.candidateReverseMap.set(
        this.mongoIdToBytes32(dto.candidateId),
        dto.candidateId,
      );
    }

    const eventId = this.mongoIdToBytes32(dto.voteId);
    const message = this.toBytes32(dto.message);
    // Signature is a 2048-bit RSA value — pass as hex bytes string (0x-prefixed),
    // not as BigInt, since it exceeds uint256 and the contract now accepts `bytes`.
    const signature = dto.signature.startsWith('0x')
      ? dto.signature
      : '0x' + dto.signature;

    let tx: ethers.ContractTransactionResponse;

    if (dto.voteType === VotingEventType.ELECTION) {
      if (!dto.candidateId) {
        throw new BadRequestException('candidateId is required for Election');
      }
      const candidateId = this.mongoIdToBytes32(dto.candidateId);
      tx = (await this.contract.castElectionVote(
        eventId,
        candidateId,
        message,
        signature,
      )) as ethers.ContractTransactionResponse;
    } else if (dto.voteType === VotingEventType.POLL) {
      if (dto.optionIndex === undefined || dto.optionIndex === null) {
        throw new BadRequestException('optionIndex is required for Poll');
      }
      tx = (await this.contract.castPollVote(
        eventId,
        dto.optionIndex,
        message,
        signature,
      )) as ethers.ContractTransactionResponse;
    } else {
      throw new BadRequestException('Invalid voteType');
    }

    this.logger.log(`Vote tx sent: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  /**
   * Set the RSA public key components (n and e) on the smart contract. This is required for the blind
   * signature verification to work.
   * @param n - The modulus of the RSA public key, as a hex string (0x-prefix optional)
   * @param e - The exponent of the RSA public key, as a hex string (0x-prefix optional)
   * @returns The transaction hash of the setRsaPublicKey transaction
   * @throws BadRequestException if the service is not properly configured
   */
  async setRsaPublicKey(n: string, e: string): Promise<string> {
    this.assertReady();
    // n is a 2048-bit modulus — pass as bytes hex string; e fits in uint256 (e.g. 65537)
    const nHex = n.startsWith('0x') ? n : '0x' + n;
    const tx = (await this.contract.setRsaPublicKey(
      nHex,
      BigInt('0x' + e),
    )) as ethers.ContractTransactionResponse;
    await tx.wait();
    this.logger.log(`RSA public key set. tx: ${tx.hash}`);
    return tx.hash;
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async getElectionVoteCount(
    eventId: string,
    candidateId: string,
  ): Promise<bigint> {
    this.assertReady();
    return (await this.contract.getElectionVoteCount(
      this.mongoIdToBytes32(eventId),
      this.mongoIdToBytes32(candidateId),
    )) as Promise<bigint>;
  }

  async getPollVoteCount(
    eventId: string,
    optionIndex: number,
  ): Promise<bigint> {
    this.assertReady();
    return (await this.contract.getPollVoteCount(
      this.mongoIdToBytes32(eventId),
      optionIndex,
    )) as Promise<bigint>;
  }

  // ─── Contract Event Subscriptions ─────────────────────────────────────────

  /**
   * Subscribe to vote events emitted by the contract. The handler will be called with a payload containing the
   * vote type, event ID, candidate/option, and new total votes whenever a vote is cast.
   *
   * @param handler - A callback function that processes the vote update payload
   * @throws InternalServerErrorException if the service is not properly configured
   *
   * @remarks This method should be called once during application initialization to start listening for events.
   * It relies on the reverse maps to decode event data back to mongoIds, so those maps must be populated
   * (e.g., by calling castVote at least once) for events to be decoded correctly.
   *
   * @see {VoteUpdatePayload} for the structure of the payload passed to the handler.
   */
  subscribeToVoteEvents(handler: (payload: VoteUpdatePayload) => void): void {
    if (!this.contract || !this.provider) {
      this.logger.warn(
        'subscribeToVoteEvents: contract/provider not ready, skipping',
      );
      return;
    }

    // contract.on() uses eth_newFilter / eth_getFilterChanges which public / load-balanced
    // RPC nodes do NOT persist → "filter not found" errors on every polling cycle.
    // Fix: poll on every new block and query logs via eth_getLogs (queryFilter).
    let lastBlock: number | null = null;

    const handleBlock = async (blockNumber: number) => {
      const fromBlock = lastBlock !== null ? lastBlock + 1 : blockNumber;
      lastBlock = blockNumber;
      if (fromBlock > blockNumber) return;

      try {
        const [electionLogs, pollLogs] = await Promise.all([
          this.contract.queryFilter(
            this.contract.filters.ElectionVoteCast(),
            fromBlock,
            blockNumber,
          ),
          this.contract.queryFilter(
            this.contract.filters.PollVoteCast(),
            fromBlock,
            blockNumber,
          ),
        ]);

        for (const ev of electionLogs) {
          const log = ev as ethers.EventLog;
          const [eventIdBytes32, candidateIdBytes32, newTotal] =
            log.args as unknown as [string, string, bigint];
          const eventInfo = this.eventReverseMap.get(eventIdBytes32);
          const candidateId = this.candidateReverseMap.get(candidateIdBytes32);
          if (!eventInfo || !candidateId) continue;
          handler({
            voteType: 'election',
            voteId: eventInfo.voteId,
            candidateId,
            newTotal: Number(newTotal),
          });
        }

        for (const ev of pollLogs) {
          const log = ev as ethers.EventLog;
          const [eventIdBytes32, optionIndex, newTotal] =
            log.args as unknown as [string, bigint, bigint];
          const eventInfo = this.eventReverseMap.get(eventIdBytes32);
          if (!eventInfo) continue;
          handler({
            voteType: 'poll',
            voteId: eventInfo.voteId,
            optionIndex: Number(optionIndex),
            newTotal: Number(newTotal),
          });
        }
      } catch (err) {
        this.logger.error('Error polling vote events:', (err as Error).message);
      }
    };

    // Wrap in sync callback — void the inner promise to satisfy no-floating-promises
    void this.provider.on('block', (blockNumber: number) => {
      void handleBlock(blockNumber);
    });

    this.logger.log(
      'Subscribed to contract vote events via block polling (eth_getLogs)',
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** keccak256(mongoObjectId) → bytes32 hex */
  mongoIdToBytes32(mongoId: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(mongoId));
  }

  /** Normalize hex string → bytes32 hex (ensure 0x + 64 chars) */
  private toBytes32(hex: string): string {
    const clean = hex.startsWith('0x') ? hex : '0x' + hex;
    return ethers.zeroPadValue(clean, 32);
  }

  private assertReady() {
    if (!this.contract) {
      this.logger.error(
        'BlockchainService is not properly configured. Missing CONTRACT_ADDRESS or ADMIN_PRIVATE_KEY.',
      );
      throw new InternalServerErrorException(
        'There was an error handing your request. Please contact the administrator.',
      );
    }
  }
}

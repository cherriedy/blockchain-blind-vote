import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VotingEventType } from '../enums';
import {
  BlockchainService,
  CastVoteDto,
  CastVoteResponseDto,
} from './blockchain';
import {
  RequestBlindSignatureDto,
  toBlindRsaPublicKeyResponseDto,
  toBlindSignatureResponseDto,
} from './blind-signature';
import { BlindRsaService } from './blind-signature';
import { Public } from 'src/shared';

@ApiTags('Voting')
@Public()
@Controller('voting')
export class VotingController {
  constructor(
    private readonly blindRsaService: BlindRsaService,
    private readonly blockchainService: BlockchainService,
  ) {}

  @Get('public-key')
  @ApiOperation({ summary: 'Get RSA public key for a voting event' })
  @ApiQuery({ name: 'voteType', enum: VotingEventType, required: true })
  @ApiQuery({ name: 'voteId', type: String, required: true })
  @ApiResponse({ status: 200, description: 'RSA public key components.' })
  getPublicKey(
    @Query('voteType') voteType: string,
    @Query('voteId') voteId: string,
  ) {
    const result = this.blindRsaService.getPublicKey(voteType, voteId);
    return toBlindRsaPublicKeyResponseDto(result);
  }

  @Post('blind')
  @ApiOperation({
    summary: 'Request an RSA blind signature',
    description:
      'The voter submits their blinded message. The server checks that the voter ' +
      'has an approved registration and has not yet received a blind signature, ' +
      'then returns blindedMessage^d mod n. ',
  })
  @ApiBody({ type: RequestBlindSignatureDto })
  @ApiResponse({ status: 201, description: 'Blind signature issued.' })
  async requestBlindSignature(@Body() body: RequestBlindSignatureDto) {
    const { blindSignature } = await this.blindRsaService.requestBlindSig(
      body.studentId,
      body.blindedMessage,
      body.voteType,
      body.voteId,
    );
    return toBlindSignatureResponseDto(blindSignature);
  }

  @Post('cast')
  @ApiOperation({
    summary: 'Cast a vote on-chain',
    description:
      'The voter submits their vote along with the RSA signature obtained from the blind signature process. ' +
      'The server verifies the signature and eligibility, then submits the vote to the blockchain. ' +
      'Returns the transaction hash of the submitted vote.',
  })
  @ApiBody({ type: CastVoteDto })
  @ApiResponse({ status: 201, type: CastVoteResponseDto })
  async castVote(@Body() body: CastVoteDto): Promise<CastVoteResponseDto> {
    const txHash = await this.blockchainService.castVote(body);
    return { txHash };
  }

  @Get('election/:id/votes/:candidateId')
  @ApiOperation({ summary: 'Get vote count for a candidate in an election' })
  @ApiResponse({ status: 200, description: 'Vote count for the candidate.' })
  async getElectionVoteCount(
    @Param('id') voteId: string,
    @Param('candidateId') candidateId: string,
  ) {
    const count = await this.blockchainService.getElectionVoteCount(
      voteId,
      candidateId,
    );
    return { count: count.toString() };
  }

  @Get('poll/:id/votes/:optionIndex')
  @ApiOperation({ summary: 'Get vote count for an option in a poll' })
  @ApiResponse({ status: 200, description: 'Vote count for the poll option.' })
  async getPollVoteCount(
    @Param('id') voteId: string,
    @Param('optionIndex') optionIndex: string,
  ) {
    const count = await this.blockchainService.getPollVoteCount(
      voteId,
      Number(optionIndex),
    );
    return { count: count.toString() };
  }
}

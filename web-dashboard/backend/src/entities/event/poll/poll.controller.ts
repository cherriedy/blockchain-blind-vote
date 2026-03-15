import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PollService } from './poll.service';
import {
  CreatePollRequestDto,
  PollIdParamDto,
  UpdatePollRequestDto,
  toPollResponseDto,
  toPollResponseDtos,
  toPollActionMessageResponseDto,
  PollResponseDto,
  PollActionMessageResponseDto,
} from './dto';
import { PrivilegedAuthGuard } from '../../../shared/gurads';
import { EventVoterResponseDto } from '../election';
import {
  AssignVoterBodyDto,
  RemoveVoterBodyDto,
  toEventVoterResponseDto,
  toEventVoterResponseDtos,
} from '../voter';
// import { PollVisibilityGuard } from '../../../shared/gurads/visibility.guard'; // temporarily removed

@ApiTags('Polls')
@Controller('polls')
export class PollController {
  constructor(private readonly pollService: PollService) {}

  // ────────────────────────────────
  // Public Voter Endpoints
  // ────────────────────────────────

  // GET: /polls/eligible
  @Get('eligible')
  @ApiOperation({
    summary: 'Get eligible polls for a voter',
    description:
      'Returns all polls the voter is assigned to. ' +
      'Identified by walletAddress and studentId query parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of eligible polls.',
    type: PollResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Voter not found.' })
  async getEligiblePolls(
    @Query('walletAddress') walletAddress: string,
    @Query('studentId') studentId: string,
  ): Promise<PollResponseDto[]> {
    const polls = await this.pollService.getEligiblePolls(
      walletAddress,
      studentId,
    );
    return toPollResponseDtos(polls);
  }

  // ────────────────────────────────
  // Admin-Protected Endpoints
  // ────────────────────────────────

  @Get()
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Get all polls' })
  @ApiResponse({
    status: 200,
    description: 'List of polls.',
    type: PollResponseDto,
    isArray: true,
  })
  async getAllPolls(): Promise<PollResponseDto[]> {
    const polls = await this.pollService.getAll();
    return toPollResponseDtos(polls);
  }

  @Get(':id')
  // @UseGuards(PollVisibilityGuard) // temporarily removed
  @ApiOperation({ summary: 'Get poll by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Poll details.',
    type: PollResponseDto,
  })
  async getPoll(
    @Param() param: PollIdParamDto,
  ): Promise<PollResponseDto | null> {
    const poll = await this.pollService.getById(param.id);
    return poll ? toPollResponseDto(poll) : null;
  }

  @Post()
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Create a new poll' })
  @ApiBody({ type: CreatePollRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Poll created.',
    type: PollResponseDto,
  })
  async createPoll(
    @Body() body: CreatePollRequestDto,
  ): Promise<PollResponseDto> {
    const poll = await this.pollService.create(body);
    return toPollResponseDto(poll);
  }

  @Put(':id')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Update a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdatePollRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Poll updated.',
    type: PollResponseDto,
  })
  async updatePoll(
    @Param() param: PollIdParamDto,
    @Body() body: UpdatePollRequestDto,
  ): Promise<PollResponseDto> {
    const poll = await this.pollService.update(param.id, body);
    return toPollResponseDto(poll);
  }

  @Delete(':id')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Delete a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Poll deleted.',
    type: PollResponseDto,
  })
  async deletePoll(@Param() param: PollIdParamDto): Promise<PollResponseDto> {
    const poll = await this.pollService.delete(param.id);
    return toPollResponseDto(poll);
  }

  // ── Voter assignment routes ──────────────────────────────────────────────

  @Get(':id/voters')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'List voters assigned to a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of voters for the poll.',
    type: EventVoterResponseDto,
    isArray: true,
  })
  async listPollVoters(@Param() param: PollIdParamDto) {
    const eventVoters = await this.pollService.listVoters(param.id);
    return toEventVoterResponseDtos(eventVoters);
  }

  @Post(':id/voters')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Assign a voter to a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AssignVoterBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Voter assigned to poll.',
    type: EventVoterResponseDto,
  })
  async assignVoterToPoll(
    @Param() param: PollIdParamDto,
    @Body() body: AssignVoterBodyDto,
  ) {
    const eventVoter = await this.pollService.assignVoter(
      param.id,
      body.voterId,
      body.canVote,
    );
    return toEventVoterResponseDto(eventVoter);
  }

  @Delete(':id/voters')
  @UseGuards(PrivilegedAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a voter from a poll' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: RemoveVoterBodyDto })
  @ApiResponse({
    status: 200,
    description: 'Voter removed from poll.',
    type: PollActionMessageResponseDto,
  })
  async removeVoterFromPoll(
    @Param() param: PollIdParamDto,
    @Body() body: RemoveVoterBodyDto,
  ) {
    const message = await this.pollService.removeVoter(param.id, body.voterId);
    return toPollActionMessageResponseDto(message);
  }
}

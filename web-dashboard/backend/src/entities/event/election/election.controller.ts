import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ElectionService } from './election.service';
import {
  CreateElectionRequestDto,
  ElectionIdParamDto,
  UpdateElectionRequestDto,
  SelfNominateDto,
  ActionMessageResponseDto,
  ElectionCandidatesResponseDto,
  ElectionResponseDto,
  EventVoterResponseDto,
} from './dto';
import { PrivilegedAuthGuard } from '../../../shared/gurads';
import { Public } from '../../../shared';
import {
  toActionMessageResponseDto,
  toElectionCandidatesResponseDto,
  toElectionResponseDto,
  toElectionResponseDtos,
} from './dto';
import {
  AssignVoterBodyDto,
  RemoveVoterBodyDto,
  toEventVoterResponseDto,
  toEventVoterResponseDtos,
} from '../voter';
// import { ElectionVisibilityGuard } from '../../../shared/gurads/visibility.guard'; // temporarily removed

@ApiTags('Elections')
@Controller('elections')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  // ────────────────────────────────
  // Public Voter Endpoints
  // ────────────────────────────────

  // GET: /elections/eligible
  @Get('eligible')
  @ApiOperation({
    summary: 'Get eligible elections for a voter',
    description:
      'Returns all elections the voter is assigned to. ' +
      'Identified by walletAddress and studentId query parameters.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of eligible elections.',
    type: ElectionResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Voter not found.' })
  async getEligibleElections(
    @Query('walletAddress') walletAddress: string,
    @Query('studentId') studentId: string,
  ): Promise<ElectionResponseDto[]> {
    const elections = await this.electionService.getEligibleElections(
      walletAddress,
      studentId,
    );
    return toElectionResponseDtos(elections);
  }

  // GET: /elections/:id/candidates
  @Get(':id/candidates')
  @Public()
  @ApiOperation({ summary: 'Get candidates for an election (public)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of candidates.',
    type: ElectionCandidatesResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Election not found.' })
  async getElectionCandidates(
    @Param() param: ElectionIdParamDto,
  ): Promise<ElectionCandidatesResponseDto> {
    const candidates = await this.electionService.getCandidates(param.id);
    return toElectionCandidatesResponseDto(candidates);
  }

  // ────────────────────────────────
  // Admin-Protected Endpoints
  // ────────────────────────────────

  // GET: /elections
  @Get()
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Get all elections' })
  @ApiResponse({
    status: 200,
    description: 'List of elections.',
    type: ElectionResponseDto,
    isArray: true,
  })
  async getAllElections(): Promise<ElectionResponseDto[]> {
    const elections = await this.electionService.getAll();
    return toElectionResponseDtos(elections);
  }

  // GET: /elections/:id
  @Get(':id')
  // @UseGuards(ElectionVisibilityGuard) // temporarily removed
  @ApiOperation({ summary: 'Get election by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Election details.',
    type: ElectionResponseDto,
  })
  async getElection(
    @Param() param: ElectionIdParamDto,
  ): Promise<ElectionResponseDto | null> {
    const election = await this.electionService.getById(param.id);
    return election ? toElectionResponseDto(election) : null;
  }

  // POST: /elections
  @Post()
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Create a new election' })
  @ApiBody({ type: CreateElectionRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Election created.',
    type: ElectionResponseDto,
  })
  async createElection(
    @Body() body: CreateElectionRequestDto,
  ): Promise<ElectionResponseDto> {
    const election = await this.electionService.create(body);
    return toElectionResponseDto(election);
  }

  // PUT: /elections/:id
  @Put(':id')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Update an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateElectionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Election updated.',
    type: ElectionResponseDto,
  })
  async updateElection(
    @Param() param: ElectionIdParamDto,
    @Body() body: UpdateElectionRequestDto,
  ): Promise<ElectionResponseDto> {
    const election = await this.electionService.update(param.id, body);
    return toElectionResponseDto(election);
  }

  // DELETE: /elections/:id
  @Delete(':id')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Delete an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Election deleted.',
    type: ElectionResponseDto,
  })
  async deleteElection(
    @Param() param: ElectionIdParamDto,
  ): Promise<ElectionResponseDto> {
    const election = await this.electionService.delete(param.id);
    return toElectionResponseDto(election);
  }

  // ────────────────────────────────
  // Voter Assignment Endpoints
  // ────────────────────────────────

  // GET: /elections/:id/voters
  @Get(':id/voters')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'List voters assigned to an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of voters for the election.',
    type: EventVoterResponseDto,
    isArray: true,
  })
  async listElectionVoters(
    @Param() param: ElectionIdParamDto,
  ): Promise<EventVoterResponseDto[]> {
    const eventVoters = await this.electionService.listVoters(param.id);
    return toEventVoterResponseDtos(eventVoters);
  }

  // POST: /elections/:id/voters
  @Post(':id/voters')
  @UseGuards(PrivilegedAuthGuard)
  @ApiOperation({ summary: 'Assign a voter to an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AssignVoterBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Voter assigned to election.',
    type: EventVoterResponseDto,
  })
  async assignVoterToElection(
    @Param() param: ElectionIdParamDto,
    @Body() body: AssignVoterBodyDto,
  ): Promise<EventVoterResponseDto> {
    const eventVoter = await this.electionService.assignVoter(
      param.id,
      body.voterId,
      body.canVote,
    );
    return toEventVoterResponseDto(eventVoter);
  }

  // DELETE: /elections/:id/voters
  @Delete(':id/voters')
  @UseGuards(PrivilegedAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a voter from an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: RemoveVoterBodyDto })
  @ApiResponse({
    status: 200,
    description: 'Voter removed from election.',
    type: ActionMessageResponseDto,
  })
  async removeVoterFromElection(
    @Param() param: ElectionIdParamDto,
    @Body() body: RemoveVoterBodyDto,
  ): Promise<ActionMessageResponseDto> {
    const message = await this.electionService.removeVoter(
      param.id,
      body.voterId,
    );
    return toActionMessageResponseDto(message);
  }

  // ────────────────────────────────
  // Self-Nomination Endpoints
  // ────────────────────────────────

  // POST: /elections/:id/self-nominate
  @Post(':id/self-nominate')
  @Public()
  @ApiOperation({
    summary: 'Self-nominate as a candidate for an election',
    description:
      'Allows an eligible voter to self-nominate for an election if self-nomination is enabled. ' +
      'The provided walletAddress and studentId must match an existing Candidate profile. ' +
      'If no candidate profile exists, the voter must first create one via POST /candidates/register.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Election ID' })
  @ApiBody({ type: SelfNominateDto, description: 'Self-nomination payload' })
  @ApiResponse({
    status: 200,
    description: 'Self-nomination successful.',
    type: ElectionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Self-nomination not allowed or candidate already nominated.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Election not found, or no candidate profile found for the provided walletAddress and studentId.',
  })
  async selfNominate(
    @Param() param: ElectionIdParamDto,
    @Body() body: SelfNominateDto,
  ): Promise<ElectionResponseDto> {
    const election = await this.electionService.selfNominate(
      param.id,
      body.walletAddress,
      body.studentId,
    );
    return toElectionResponseDto(election);
  }
}

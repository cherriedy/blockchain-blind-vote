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
  Req,
  Patch,
  Request,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
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
  GetElectionsQueryDto,
  RemoveAdminBodyDto,
  AssignAdminBodyDto,
  SelfNominationResponseDto,
  toSelfNominationResponseDto,
  RejectSelfNomineeDto,
  RequestInfoSelfNomineeDto,
  ResubmitSelfNominateDto,
} from './dto';
import { ManagedElection, Public, Roles } from '../../../shared';
import {
  toActionMessageResponseDto,
  toElectionCandidatesResponseDto,
  toElectionResponseDto,
  toElectionResponseDtos,
} from './dto';
import {
  AssignVoterBodyDto,
  RemoveVoterBodyDto,
  toEventVoterResponseDtos,
} from '../voter';
import { AdminRole, Election, SelfNominationStatus } from '@prisma/client';
import { AdminResponseDto, toAdminResponseDto } from 'src/entities/admin';
import { ElectionPermissionGuard } from 'src/shared/guards/election-permission.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuditLogResponseDto } from 'src/entities/audit-log/dto/log.dto';
import { toAuditLogResponseDto } from 'src/entities/audit-log/dto/log.mapper';

@ApiTags('Elections')
@Controller('elections')
@UseGuards(ElectionPermissionGuard)
export class ElectionController {
  constructor(private readonly electionService: ElectionService) { }

  // ────────────────────────────────
  // Public Voter Endpoints
  // ────────────────────────────────

  // GET: /elections/eligible
  @Get('eligible')
  @Public()
  @ApiOperation({
    summary: 'Get eligible elections for a voter (public)',
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

  @Get('my-self-nominations')
  @Public()
  @ApiOperation({ summary: 'Get my self-nomination by walletAddress and studentId (public)' })
  @ApiQuery({ name: 'walletAddress', required: true, type: String })
  @ApiQuery({ name: 'studentId', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'My self-nominations',
    type: [SelfNominationResponseDto],
  })
  async getMySelfNominations(
    @Query('walletAddress') walletAddress: string,
    @Query('studentId') studentId: string,
  ): Promise<SelfNominationResponseDto[]> {
    if (!walletAddress) {
      throw new BadRequestException('walletAddress is required');
    }
    if (!studentId) {
      throw new BadRequestException('studentId is required');
    }
    const result = await this.electionService.getMySelfNominations(
      walletAddress,
      studentId
    );

    return result.map(toSelfNominationResponseDto);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get all public elections (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of public elections.',
    type: ElectionResponseDto,
    isArray: true,
  })
  async getPublicElections(
    @Query('walletAddress') walletAddress: string,
    @Query('studentId') studentId: string,
  ): Promise<ElectionResponseDto[]> {
    const elections = await this.electionService.getPublicElections(
      walletAddress,
      studentId
    );
    return toElectionResponseDtos(elections);
  }

  // GET: /self-nominees
  @Get('/self-nominees')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all self-nominations' })
  @ApiResponse({
    status: 200,
    description: 'All self-nominations retrieved.',
    type: [SelfNominationResponseDto],
  })
  async getAllSelfNominees(
    @Query('status') status?: SelfNominationStatus
  ): Promise<SelfNominationResponseDto[]> {
    const data = await this.electionService.getAllSelfNominations(status);
    return data.map(toSelfNominationResponseDto);
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
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ApiOperation({ summary: 'Get all elections' })
  @ApiResponse({
    status: 200,
    description: 'List of elections.',
    type: ElectionResponseDto,
    isArray: true,
  })
  async getAllElections(
    @Query() query: GetElectionsQueryDto,
    @Req() request: any
  ): Promise<ElectionResponseDto[]> {
    const admin = request.admin; // attach bởi AdminAuthGuard
    const elections = await this.electionService.getAll(admin, query);
    return toElectionResponseDtos(elections);
  }

  // GET: /elections/:id
  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
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
  @Roles(AdminRole.SUPER_ADMIN,)
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
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
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
  @Roles(AdminRole.SUPER_ADMIN,)
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
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
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
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'Assign multiple voters to an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AssignVoterBodyDto })
  @ApiResponse({
    status: 200,
    description: 'Voters assigned to election.',
    type: [EventVoterResponseDto],
  })
  async assignVotersToElection(
    @Param() param: ElectionIdParamDto,
    @Body() body: AssignVoterBodyDto,
  ) {
    return this.electionService.assignVoters(
      param.id,
      body.voterIds,
      body.canVote,
    );
  }


  // DELETE: /elections/:id/voters
  @Delete(':id/voters')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
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

  // GET: /elections/:id/admins
  @Get(':id/admins')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'List admins assigned to an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of admins for the election.',
    type: AdminResponseDto,
    isArray: true,
  })
  async listElectionAdmins(
    @Param() param: ElectionIdParamDto,
  ) {
    return await this.electionService.listAdmins(param.id);
  }

  //POST: /elections/:id/admins
  @Post(':id/admins')
  @Roles(AdminRole.SUPER_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'Assign admins to an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: AssignAdminBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Admin assigned to election.',
    type: ElectionResponseDto,
  })
  async assignAdminToElection(
    @Param() param: ElectionIdParamDto,
    @Body() body: AssignAdminBodyDto,
  ) {
    const assignments = await this.electionService.assignAdmins(
      param.id,
      body.adminIds,
    );

    return assignments;
  }

  // DELETE: /elections/:id/admins
  @Delete(':id/admins')
  @Roles(AdminRole.SUPER_ADMIN)
  @ManagedElection()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove an admin from an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: RemoveAdminBodyDto })
  @ApiResponse({
    status: 200,
    description: 'Admin removed from election.',
    type: ActionMessageResponseDto,
  })
  async removeAdminFromElection(
    @Param() param: ElectionIdParamDto,
    @Body() body: RemoveAdminBodyDto,
  ): Promise<ActionMessageResponseDto> {
    const message = await this.electionService.removeAdmin(
      param.id,
      body.adminId,
    );
    return toActionMessageResponseDto(message);
  }


  // ────────────────────────────────
  // Self-Nomination Endpoints
  // ────────────────────────────────

  // POST: /elections/:id/self-nominees
  @Post(':id/self-nominees')
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
    @Body() dto: SelfNominateDto,
  ): Promise<SelfNominationResponseDto> {
    const election = await this.electionService.selfNominate(
      param.id,
      dto,
    );
    return toSelfNominationResponseDto(election);
  }

  //GET /elections/:id/self-nominees
  @Get(':id/self-nominees')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ELECTION_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'Get all self-nominated candidates for an election' })
  @ApiParam({ name: 'id', type: String, description: 'Election ID' })
  @ApiResponse({
    status: 200,
    description: 'Self-nominated candidates retrieved.',
    type: [SelfNominationResponseDto],
  })
  async getSelfNominees(
    @Param() param: ElectionIdParamDto,
    @Query('status') status?: SelfNominationStatus,
  ): Promise<SelfNominationResponseDto[]> {
    const selfNominations = await this.electionService.getSelfNominations(param.id, status);
    return selfNominations.map(toSelfNominationResponseDto);
  }

  // POST: /elections/:id/self-nominees/:candidateId/approve
  @Post(':id/self-nominees/:candidateId/approve')
  @Roles(AdminRole.SUPER_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'Approve a self-nominated candidate for an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Candidate approved.',
    type: AuditLogResponseDto,
  })
  async approveSelfNominee(
    @Param() param: { id: string; candidateId: string },
    @Request() req: any
  ): Promise<AuditLogResponseDto> {
    const adminId = req.admin.id;
    const log = await this.electionService.approveSelfNominee(
      param.id,
      param.candidateId,
      adminId
    );
    return toAuditLogResponseDto(log)
  }

  //DELETE	/elections/:id/self-nominees/:candidateId/reject
  @Patch(':id/self-nominees/:candidateId/reject')
  @Roles(AdminRole.SUPER_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'Reject a self-nominated candidate for an election' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Candidate rejected.',
    type: AuditLogResponseDto,
  })
  async rejectSelfNominee(
    @Param() param: { id: string; candidateId: string },
    @Body() body: RejectSelfNomineeDto,
    @Request() req: any
  ): Promise<AuditLogResponseDto> {
    const adminId = req.admin.id;

    const log = await this.electionService.rejectSelfNominee(
      param.id,
      param.candidateId,
      adminId,
      body.adminNotes
    );

    return toAuditLogResponseDto(log);
  }

  // PATCH: /elections/:id/self-nominees/:candidateId/request-info
  @Patch(':id/self-nominees/:candidateId/request-info')
  @Roles(AdminRole.SUPER_ADMIN)
  @ManagedElection()
  @ApiOperation({ summary: 'Request more information from a self-nominated candidate' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'candidateId', type: String })
  @ApiResponse({
    status: 200,
    description: 'Requested additional information.',
    type: AuditLogResponseDto,
  })
  async requestInfoSelfNominee(
    @Param() param: { id: string; candidateId: string },
    @Body() body: RequestInfoSelfNomineeDto,
    @Request() req: any
  ): Promise<AuditLogResponseDto> {
    const adminId = req.admin.id;

    const log = await this.electionService.requestInfoSelfNominee(
      param.id,
      param.candidateId,
      adminId,
      body.adminNotes
    );

    return toAuditLogResponseDto(log);
  }

  // PATCH /elections/:id/self-nominees/resubmit
  @Patch(':id/self-nominees/resubmit')
  @Public()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + file.originalname.replace(/\s/g, '');
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'Resubmit self-nomination after request for more info' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Resubmitted successfully.',
  })
  async resubmitSelfNomination(
    @Param('id') electionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: ResubmitSelfNominateDto,
  ): Promise<SelfNominationResponseDto> {
    console.log(file);
    const result = await this.electionService.resubmitSelfNomination(electionId, body, file);
    return toSelfNominationResponseDto(result);
  }
}

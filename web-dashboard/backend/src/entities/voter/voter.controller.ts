import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { VoterService } from './voter.service';
import {
  CreateVoterRequestDto,
  SetVoterStatusRequestDto,
  VoterIdParamDto,
  VoterStudentIdParamDto,
} from './dto';
import { Public } from 'src/shared';

@ApiTags('Voters')
@Controller('voters')
export class VoterController {
  constructor(private readonly voterService: VoterService) { }

  @Post()
  @ApiOperation({
    summary: 'Create a new voter',
    description:
      'Creates a new voter with the provided student ID, wallet address, and active status.',
  })
  @ApiBody({
    type: CreateVoterRequestDto,
    description: 'Voter creation payload',
  })
  @ApiResponse({ status: 201, description: 'Voter created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async createVoter(
    @Body() dto: CreateVoterRequestDto,
    @Request() req: any
  ) {
    return this.voterService.create(
      dto.studentId,
      dto.walletAddress,
      dto.name,
      dto.email,
      dto.isActive,
      req.admin.id
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all voters',
    description: 'Retrieves a list of all voters in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all voters returned successfully.',
  })
  async getAllVoters(
    @Query('search') search: string,
    @Request() req: any
  ) {
    return this.voterService.getAll(search);
  }

  @Get(':studentId')
  @Public()
  @ApiOperation({
    summary: 'Get voter by student ID',
    description: 'Retrieves a voter\'s details using their student ID.',
  })
  @ApiParam({
    name: 'studentId',
    type: String,
    description: 'Student ID of the voter to retrieve',
  })
  @ApiResponse({ status: 404, description: 'Voter not found.' })
  async getVoter(@Param() params: VoterStudentIdParamDto) {
    return this.voterService.getByStudentId(params.studentId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Set voter status',
    description: 'Updates the active status of a voter by their ID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique identifier of the voter',
  })
  @ApiBody({
    type: SetVoterStatusRequestDto,
    description: 'Payload to set voter status',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter status updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Voter not found.' })
  async setVoterStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req: any
  ) {
    return this.voterService.setVoterStatusById(
      id,
      isActive,
      req.admin.id,
      req.admin.walletAddress
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete voter',
    description: 'Deletes a voter by their unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique identifier of the voter',
  })
  @ApiResponse({ status: 200, description: 'Voter deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Voter not found.' })
  async deleteVoter(
    @Param() params: VoterIdParamDto,
    @Request() req: any
  ) {
    return this.voterService.delete(params.id, req.admin.id,);
  }
}

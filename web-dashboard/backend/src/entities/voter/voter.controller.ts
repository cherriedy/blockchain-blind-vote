import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
} from './dto';

@ApiTags('Voters')
@Controller('voters')
export class VoterController {
  constructor(private readonly voterService: VoterService) {}

  @Post('')
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
  async createVoter(@Body() dto: CreateVoterRequestDto) {
    return this.voterService.create(
      dto.studentId,
      dto.walletAddress,
      dto.isActive,
    );
  }

  @Get('')
  @ApiOperation({
    summary: 'Get all voters',
    description: 'Retrieves a list of all voters in the system.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all voters returned successfully.',
  })
  async getAllVoters() {
    return this.voterService.getAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get voter by ID',
    description: 'Retrieves a voter by their unique identifier.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique identifier of the voter',
  })
  @ApiResponse({
    status: 200,
    description: 'Voter found and returned successfully.',
  })
  @ApiResponse({ status: 404, description: 'Voter not found.' })
  async getVoter(@Param() params: VoterIdParamDto) {
    return this.voterService.getById(params.id);
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
    @Param() params: VoterIdParamDto,
    @Body() dto: SetVoterStatusRequestDto,
  ) {
    return this.voterService.setVoterStatusById(params.id, dto.isActive);
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
  async deleteVoter(@Param() params: VoterIdParamDto) {
    return this.voterService.delete(params.id);
  }
}

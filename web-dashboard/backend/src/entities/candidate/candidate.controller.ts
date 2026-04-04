import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CandidateService } from './candidate.service';
import {
  CreateCandidateRequestDto,
  CandidateIdParamDto,
  UpdateCandidateRequestDto,
  CandidateResponseDto,
} from './dto';
import { Public } from '../../shared/decorations';
import { toCandidateResponseDto, toCandidateResponseDtos } from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@ApiTags('Candidates')
@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  // ────────────────────────────────
  // Public Endpoints
  // ────────────────────────────────

  // POST: /candidates/register
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register as a candidate (public)',
    description:
      'Allows an eligible voter to create their own candidate profile. ' +
      'The provided walletAddress and studentId must match an existing active Voter record. ' +
      'If no matching voter is found, the request is rejected with a message directing the user to register as a voter first.',
  })
  @ApiBody({ type: CreateCandidateRequestDto })
  @ApiResponse({
    status: 201,
    type: CandidateResponseDto,
    description: 'Candidate profile created successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'No eligible voter found with the provided walletAddress and studentId.',
  })
  @ApiResponse({ status: 403, description: 'Voter account is not active.' })
  @ApiResponse({
    status: 409,
    description: 'Candidate profile already exists for this wallet address.',
  })
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
  async registerAsCandidate(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateCandidateRequestDto,
  ): Promise<CandidateResponseDto> {
    const avatarUrl = file ? `/uploads/${file.filename}` : undefined;

    const candidate = await this.candidateService.registerAsCandidate({
      ...body,
      avatarUrl,
    });

    return toCandidateResponseDto(candidate);
  }

  @Get('me')
  @Public()
  @ApiOperation({ summary: 'Get my candidate by walletAddress (public)' })
  @ApiQuery({ name: 'walletAddress', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'My candidate info',
    type: CandidateResponseDto,
  })
  async getMyCandidate(
    @Query('walletAddress') walletAddress: string,
  ): Promise<CandidateResponseDto | null> {
    if (!walletAddress) {
      throw new BadRequestException('walletAddress is required');
    }
    const candidate = await this.candidateService.getByWallet(walletAddress);
    return candidate ? toCandidateResponseDto(candidate) : null;
  }

  // ADMIN ROLE
  @Get()
  @ApiOperation({ summary: 'Get all candidates' })
  @ApiResponse({
    status: 200,
    description: 'List of candidates.',
    type: CandidateResponseDto,
    isArray: true,
  })
  async getAllCandidates(
    @Query('search') search?: string,
  ): Promise<CandidateResponseDto[]> {
    const candidates = await this.candidateService.getAll(search);
    return toCandidateResponseDtos(candidates);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Candidate details.',
    type: CandidateResponseDto,
  })
  async getCandidate(
    @Param() param: CandidateIdParamDto,
  ): Promise<CandidateResponseDto | null> {
    const candidate = await this.candidateService.getById(param.id);
    return candidate ? toCandidateResponseDto(candidate) : null;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new candidate (admin)' })
  @ApiBody({ type: CreateCandidateRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Candidate created.',
    type: CandidateResponseDto,
  })
  async createCandidate(
    @Body() body: CreateCandidateRequestDto,
    @Request() req: any,
  ): Promise<CandidateResponseDto> {
    const candidate = await this.candidateService.create(body, req.admin.id);
    return toCandidateResponseDto(candidate);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a candidate' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateCandidateRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Candidate updated.',
    type: CandidateResponseDto,
  })
  async updateCandidate(
    @Param() param: CandidateIdParamDto,
    @Body() body: UpdateCandidateRequestDto,
    @Request() req: any,
  ): Promise<CandidateResponseDto> {
    const candidate = await this.candidateService.update(param.id, body, req.admin.id);
    return toCandidateResponseDto(candidate);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a candidate' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Candidate deleted.',
    type: CandidateResponseDto,
  })
  async deleteCandidate(
    @Param() param: CandidateIdParamDto,
    @Request() req: any,
  ): Promise<CandidateResponseDto> {
    const candidate = await this.candidateService.delete(param.id, req.admin.id);
    return toCandidateResponseDto(candidate);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  CreateAdminRequestDto,
  UpdateAdminRequestDto,
  AdminIdParamDto,
  AdminResponseDto,
} from './dto';
import { toAdminResponseDto, toAdminResponseDtos } from './dto';
import { Roles } from '../../shared/decorations';
import { AdminRole } from '@prisma/client';

@ApiTags('Admins')
@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // SUPER_ADMIN ONLY
  @Post()
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create admin' })
  async create(
    @Body() body: CreateAdminRequestDto,
  ): Promise<AdminResponseDto> {
    const admin = await this.adminService.create(body);
    return toAdminResponseDto(admin);
  }

  @Get()
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admins' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: AdminRole })
  async getAll(
    @Query('search') search?: string,
    @Query('role') role?: AdminRole,
    @Request() req?: any,
  ): Promise<AdminResponseDto[]> {
    const currentAdminId = req.admin.id;
    const admins = await this.adminService.getAll(search, role, currentAdminId);
    return toAdminResponseDtos(admins);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current admin info' })
  async getMe(@Request() req: any): Promise<AdminResponseDto> {
    return toAdminResponseDto(req.admin);
  }

  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get admin by ID' })
  async getById(
    @Param() param: AdminIdParamDto,
  ): Promise<AdminResponseDto> {
    const admin = await this.adminService.getById(param.id);
    return toAdminResponseDto(admin);
  }

  @Put(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin' })
  async update(
    @Param() param: AdminIdParamDto,
    @Request() req: any,
    @Body() body: UpdateAdminRequestDto,
  ): Promise<AdminResponseDto> {
    const currentAdminId = req.admin.id;
    const admin = await this.adminService.update(param.id, body, currentAdminId);
    return toAdminResponseDto(admin);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete admin' })
  async delete(
    @Param() param: AdminIdParamDto,
    @Request() req: any,
  ) {
    const currentAdminId = req.admin.id;
    return await this.adminService.delete(param.id, currentAdminId);
  }
}
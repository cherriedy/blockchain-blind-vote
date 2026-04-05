import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AdminRole } from '@prisma/client';
import { MANAGED_POLL_KEY } from '../decorations';
import { PollService } from '../../entities/event/poll/poll.service';

@Injectable()
export class PollPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => PollService))
    private readonly pollService: PollService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const paramName = this.reflector.getAllAndOverride<string>(
      MANAGED_POLL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!paramName) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const admin = request.admin;

    if (!admin) throw new ForbiddenException('Admin not found');

    // SUPER_ADMIN bypass
    if (admin.role === AdminRole.SUPER_ADMIN) return true;

    // chỉ check nếu là POLL_ADMIN
    if (admin.role !== AdminRole.POLL_ADMIN) {
      throw new ForbiddenException('Not a poll admin');
    }

    let pollId = request.params[paramName];
    if (Array.isArray(pollId)) pollId = pollId[0];

    if (!pollId) {
      throw new ForbiddenException('Poll ID missing');
    }

    const canManage = await this.pollService.isAdminAssignedToPoll(
      admin.id,
      pollId,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'POLL_ADMIN does not have permission for this poll',
      );
    }

    return true;
  }
}

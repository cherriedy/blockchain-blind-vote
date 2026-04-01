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
import { MANAGED_ELECTION_KEY } from '../decorations';
import { ElectionService } from 'src/entities/event/election/election.service';

@Injectable()
export class ElectionPermissionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(forwardRef(() => ElectionService))
        private readonly electionService: ElectionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const paramName = this.reflector.getAllAndOverride<string>(
            MANAGED_ELECTION_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!paramName) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const admin = request.admin;

        if (!admin) throw new ForbiddenException('Admin not found');

        // SUPER_ADMIN bypass
        if (admin.role === AdminRole.SUPER_ADMIN) return true;

        // chỉ check nếu là ELECTION_ADMIN
        if (admin.role !== AdminRole.ELECTION_ADMIN) {
            throw new ForbiddenException('Not a election admin');
        }

        let electionId = request.params[paramName];
        if (Array.isArray(electionId)) electionId = electionId[0];

        if (!electionId) {
            throw new ForbiddenException('Election ID missing');
        }

        const canManage = await this.electionService.isAdminAssignedToElection(
            admin.id,
            electionId,
        );

        if (!canManage) {
            throw new ForbiddenException(
                'ELECTION_ADMIN does not have permission for this election',
            );
        }

        return true;
    }
}
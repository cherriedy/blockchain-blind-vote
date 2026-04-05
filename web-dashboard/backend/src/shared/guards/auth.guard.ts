import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorations';
import { AdminService } from 'src/entities/admin';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(forwardRef(() => AdminService))
    private readonly adminService: AdminService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();

    let wallet = request.headers['x-admin-wallet-address'];
    wallet = Array.isArray(wallet) ? wallet[0] : wallet;

    if (!wallet) {
      throw new UnauthorizedException('Missing admin wallet');
    }

    const normalizedWallet = wallet.trim().toLowerCase();

    const admin = await this.adminService.findByWallet(normalizedWallet);

    if (!admin || !admin.isActive) {
      throw new ForbiddenException('Admin not found or inactive');
    }

    // attach admin vào request để dùng tiếp
    request['admin'] = admin;

    return true;
  }
}

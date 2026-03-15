import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { VotingContextService } from '../../voting';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorations';

/**
 * @description
 * Guard to protect admin routes by checking the x-admin-wallet-address header against
 * the configured admin wallet address. Only requests with the correct admin wallet
 * address will be allowed to access the protected routes.
 *
 * @class PrivilegedAuthGuard
 * @implements {CanActivate}
 * @remarks
 * The admin wallet address should be set in the environment variable `ADMIN_WALLET_ADDRESS`.
 */
@Injectable()
export class PrivilegedAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly votingContextService: VotingContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();

    let providedWallet = request.headers['x-admin-wallet-address'];
    providedWallet = Array.isArray(providedWallet)
      ? providedWallet[0]
      : providedWallet;
    if (!providedWallet) {
      throw new UnauthorizedException(
        'x-admin-wallet-address header is required',
      );
    }

    const configuredWallet = this.votingContextService.normalizeWalletAddress(
      this.votingContextService.adminWallet?.address || '',
    );
    if (!configuredWallet) {
      Logger.error('Please set ADMIN_WALLET_ADDRESS in environment variables');
      throw new InternalServerErrorException(
        'There was an error with the server',
      );
    }

    const normalizedProvidedWallet =
      this.votingContextService.normalizeWalletAddress(providedWallet);
    if (normalizedProvidedWallet !== configuredWallet) {
      throw new ForbiddenException('Only admin wallet can access this route');
    }

    return true;
  }
}
